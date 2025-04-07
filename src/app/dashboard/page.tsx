'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  faculty: string;
  major: string;
  courses: string[];
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  connection_count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    activeConnections: 0,
    pendingRequests: 0,
    upcomingEvents: 0
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchConnections = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: connectionsData, error } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${session.user.id},connected_user_id.eq.${session.user.id}`);

      if (error) {
        console.error('Error fetching connections:', error);
        throw error;
      }

      const activeConnections = connectionsData?.filter(conn => 
        conn.status === 'accepted'
      ).length || 0;

      const pendingRequests = connectionsData?.filter(conn => 
        conn.status === 'pending' && conn.connected_user_id === session.user.id
      ).length || 0;

      setStats(prev => ({ 
        ...prev, 
        activeConnections,
        pendingRequests
      }));
    } catch (error) {
      console.error('Error in fetchConnections:', error);
    }
  }, [router]);

  const fetchEvents = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*');

      if (error) {
        console.error('Error fetching events:', error);
        setUpcomingEvents([]);
        return;
      }

      const sortedEvents = eventsData?.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const formattedEvents = sortedEvents?.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.date).toLocaleDateString(),
        time: new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: event.location || 'Location TBD'
      })) || [];

      setUpcomingEvents(formattedEvents);
      setStats(prev => ({ ...prev, upcomingEvents: formattedEvents.length }));
    } catch (error) {
      console.error('Error fetching events:', error);
      setUpcomingEvents([]);
    }
  }, [router]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const supabase = getSupabase();
      
      // Get all accepted connections with a more explicit query
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select(`
          id,
          user_id,
          connected_user_id,
          status,
          created_at
        `)
        .eq('status', 'accepted');

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        throw connectionsError;
      }

      // Log the raw SQL query for debugging
      console.log('Raw accepted connections:', connectionsData);
      console.log('Number of accepted connections:', connectionsData?.length || 0);

      // Count active connections for each user
      const connectionCounts = new Map<string, number>();
      connectionsData?.forEach(conn => {
        // Each connection counts as 1 for both users involved
        connectionCounts.set(conn.user_id, (connectionCounts.get(conn.user_id) || 0) + 1);
        connectionCounts.set(conn.connected_user_id, (connectionCounts.get(conn.connected_user_id) || 0) + 1);
      });

      // Log all connection counts
      console.log('Connection counts by user:', Object.fromEntries(connectionCounts));

      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Log all profiles
      console.log('All profiles:', profilesData);

      // Combine connection counts with user names and sort by connection count
      const leaderboardData = profilesData
        ?.map(profile => {
          const count = connectionCounts.get(profile.user_id) || 0;
          console.log(`User ${profile.full_name} (${profile.user_id}) has ${count} connections`);
          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            connection_count: count
          };
        })
        .sort((a, b) => b.connection_count - a.connection_count)
        .slice(0, 3); // Get top 3 users

      console.log('Final leaderboard data:', leaderboardData);

      setLeaderboard(leaderboardData || []);

      // Double check the database directly
      const { data: checkData, error: checkError } = await supabase
        .from('connections')
        .select('status')
        .eq('status', 'accepted');
      
      console.log('Double check accepted connections:', checkData);
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist, redirect to profile setup
            router.push('/profile-setup');
            return;
          }
          throw profileError;
        }

        // Check if profile is complete
        if (!profileData?.full_name || !profileData?.faculty || !profileData?.major || !profileData?.courses?.length) {
          router.push('/profile-setup');
          return;
        }

        setProfile(profileData);

        await Promise.all([
          fetchConnections(),
          fetchEvents(),
          fetchLeaderboard()
        ]);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    initializeDashboard();
  }, [fetchConnections, fetchEvents, fetchLeaderboard, router]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-purple-600">Welcome back, {profile?.full_name.split(' ')[0]}!</h1>
          <p className="text-gray-600 mt-2">Here&apos;s what&apos;s happening with your study network</p>
        </div>
        <Link href="/profile-setup">
          <Button className="bg-purple-600 hover:bg-purple-700">
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/connections?tab=active">
          <Card className="cursor-pointer hover:bg-purple-50 transition-colors">
            <CardHeader>
              <CardTitle>Active Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.activeConnections}</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/connections?tab=pending">
          <Card className="cursor-pointer hover:bg-purple-50 transition-colors">
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pendingRequests}</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/events">
          <Card className="cursor-pointer hover:bg-purple-50 transition-colors">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{upcomingEvents.length}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Connection Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div key={entry.user_id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-400' :
                    index === 1 ? 'bg-gray-300' :
                    'bg-amber-600'
                  }`}>
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{entry.full_name}</p>
                    <p className="text-sm text-gray-500">{entry.connection_count} connections</p>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-gray-500">No connections yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="rounded-full p-2 bg-blue-100">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {event.date} at {event.time}
                    </p>
                    <p className="text-sm text-gray-500">{event.location}</p>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="text-gray-500">No upcoming events</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">You&apos;re making great progress! Keep building those connections!</p>
    </div>
  );
} 