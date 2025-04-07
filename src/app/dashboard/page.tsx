'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Calendar,
  Users,
  Trophy,
  Bell,
  ChevronRight,
  MapPin,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  date: Date;
  time: string;
  location: string;
  description: string;
  created_by: string;
  created_at: string;
  url: string | null;
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
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setUpcomingEvents([]);
        return;
      }

      const sortedEvents = eventsData?.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const formattedEvents = sortedEvents?.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.created_at.split('T')[0]),
        time: event.time,
        location: event.location || 'Location TBD',
        description: event.description,
        created_by: event.created_by,
        created_at: event.created_at,
        url: event.url ? (event.url.startsWith('http://') || event.url.startsWith('https://') ? event.url : `https://${event.url}`) : null
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
      const { data: checkData } = await supabase
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening in your network
          </p>
        </div>
        <Link href="/profile-setup">
          <Button variant="outline" className="flex items-center gap-2">
            Edit Profile
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/connections?tab=active" className="block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeConnections}</div>
                <p className="text-xs text-gray-500">Network members</p>
              </CardContent>
            </Card>
          </motion.div>
        </Link>

        <Link href="/connections?tab=pending" className="block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Bell className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                <p className="text-xs text-gray-500">Awaiting response</p>
              </CardContent>
            </Card>
          </motion.div>
        </Link>

        <Link href="/events" className="block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                <p className="text-xs text-gray-500">Events this month</p>
              </CardContent>
            </Card>
          </motion.div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Events Section */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Stay updated with the latest events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      if (event.url) {
                        window.open(event.url, '_blank', 'noopener,noreferrer');
                      } else {
                        router.push(`/events/${event.id}`);
                      }
                    }}
                  >
                    <div className="flex-shrink-0">
                      <Calendar className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.date.toLocaleDateString()} at {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No upcoming events scheduled
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Section */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Top Connectors
            </CardTitle>
            <CardDescription>Users with most connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{entry.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{entry.connection_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 