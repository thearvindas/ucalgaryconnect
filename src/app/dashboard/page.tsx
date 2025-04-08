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
import { format } from 'date-fns';

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
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setUpcomingEvents([]);
        return;
      }

      const formattedEvents = eventsData?.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.start_date),
        time: format(new Date(event.start_date), 'hh:mm a'),
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
    console.log('Fetching global leaderboard data...'); 
    try {
      // Use a clean Supabase client instance for clarity, though default should work
      const supabase = getSupabase(); 
      
      // 1. Fetch ALL accepted connections
      console.log('Querying ALL accepted connections...');
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('user_id, connected_user_id') // Only select needed columns
        .eq('status', 'accepted');

      if (connectionsError) {
        console.error('Error fetching connections for leaderboard:', connectionsError);
        // Optionally set an error state for the leaderboard component
        setLeaderboard([]); 
        return; 
      }
      console.log('Raw accepted connections received:', connectionsData);

      if (!connectionsData) {
          console.log('No accepted connections data found.');
          setLeaderboard([]);
          return;
      }

      // 2. Count connections per user
      const connectionCounts = new Map<string, number>();
      connectionsData.forEach(conn => {
        connectionCounts.set(conn.user_id, (connectionCounts.get(conn.user_id) || 0) + 1);
        connectionCounts.set(conn.connected_user_id, (connectionCounts.get(conn.connected_user_id) || 0) + 1);
      });
      console.log('Calculated connection counts:', Object.fromEntries(connectionCounts));

      // 3. Fetch ALL profiles needed for the leaderboard (user_id, full_name)
      console.log('Querying ALL profiles for leaderboard...');
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name'); // Only select needed columns

      if (profilesError) {
        console.error('Error fetching profiles for leaderboard:', profilesError);
        setLeaderboard([]); 
        return;
      }
       console.log('Raw profiles data received:', profilesData);

       if (!profilesData) {
          console.log('No profiles data found.');
          setLeaderboard([]);
          return;
      }

      // 4. Combine, Sort, and Slice
      const leaderboardData = profilesData
        .map(profile => ({
          user_id: profile.user_id,
          full_name: profile.full_name || 'Unnamed User', // Handle potential null names
          connection_count: connectionCounts.get(profile.user_id) || 0
        }))
        .sort((a, b) => b.connection_count - a.connection_count) // Sort descending by count
        .slice(0, 3); // Get top 3

      console.log('Final leaderboard data:', leaderboardData);
      setLeaderboard(leaderboardData);
      console.log('Leaderboard state updated.');

    } catch (error) {
      console.error('Unexpected error fetching leaderboard:', error);
      setLeaderboard([]); // Ensure leaderboard is cleared on error
    }
  }, []); // No dependencies, truly global fetch logic

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

  const ConnectionCount = ({ count }: { count: number }) => {
    const text = count === 1 ? 'connection' : 'connections';
    return (
      <span>
        {count} {text}
      </span>
    );
  };

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
            Welcome back, {profile?.full_name?.split(' ')[0] || "User"}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here{"'"}s what{"'"}s happening in your network
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
              {leaderboard.map((user, index) => (
                <div key={user.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        <ConnectionCount count={user.connection_count} />
                      </p>
                    </div>
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