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
  bio: string | null;
  skills: string[];
  interests: string[];
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    activeConnections: 0,
    pendingRequests: 0,
    upcomingEvents: 0
  });
  const [events, setEvents] = useState<Event[]>([]);

  const fetchConnections = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch all connections first
      const { data: connectionsData, error } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${session.user.id},connected_user_id.eq.${session.user.id}`);

      if (error) {
        console.error('Error fetching connections:', error);
        throw error;
      }

      console.log('All connections:', connectionsData);

      // Count active connections (all connections shown in the My Connections tab)
      const activeConnections = connectionsData?.length || 0;
      console.log('Active connections count:', activeConnections);

      // Count pending requests (where user is the receiver and status is pending)
      const pendingRequests = connectionsData?.filter(conn => 
        conn.status === 'pending' && conn.connected_user_id === session.user.id
      ).length || 0;

      console.log('Setting stats - active:', activeConnections, 'pending:', pendingRequests);
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

      // Fetch events
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*');

      if (error) {
        console.error('Error fetching events:', error);
        setUpcomingEvents([]);
        return;
      }

      // Sort events by date
      const sortedEvents = eventsData?.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Format events
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

        // Fetch user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch all data in parallel
        await Promise.all([
          fetchConnections(),
          fetchEvents()
        ]);

      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    initializeDashboard();
  }, [fetchConnections, fetchEvents, router]);

  const calculateProfileCompletion = (profile: Profile): number => {
    if (!profile) return 0;
    
    const fields = [
      profile.full_name,
      profile.faculty,
      profile.major,
      profile.courses?.length > 0,
      profile.bio,
      profile.skills?.length > 0,
      profile.interests?.length > 0
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const calculateMatchPercentage = (partner: Profile): number => {
    if (!profile) return 0;
    
    let matchPoints = 0;
    let totalPoints = 0;

    // Match courses
    const commonCourses = partner.courses.filter(course => 
      profile.courses.includes(course)
    ).length;
    matchPoints += commonCourses * 2;
    totalPoints += Math.max(profile.courses.length, partner.courses.length) * 2;

    // Match skills
    const commonSkills = partner.skills.filter(skill => 
      profile.skills.includes(skill)
    ).length;
    matchPoints += commonSkills;
    totalPoints += Math.max(profile.skills.length, partner.skills.length);

    // Match interests
    const commonInterests = partner.interests.filter(interest => 
      profile.interests.includes(interest)
    ).length;
    matchPoints += commonInterests;
    totalPoints += Math.max(profile.interests.length, partner.interests.length);

    return totalPoints === 0 ? 0 : Math.round((matchPoints / totalPoints) * 100);
  };

  const fetchActivities = async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch connection activities
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select(`
          *,
          profile:profiles!connections_user_id_fkey(
            full_name
          )
        `)
        .or(`user_id.eq.${session.user.id},connected_user_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (connectionsError) {
        console.error('Error fetching connection activities:', connectionsError);
        setActivities([]);
        return;
      }

      // Format connection activities
      const connectionActivities: Activity[] = connectionsData?.map(conn => ({
        id: conn.id,
        type: 'connection' as const,
        description: conn.status === 'accepted' 
          ? `Connected with ${conn.profile.full_name}`
          : `New connection request from ${conn.profile.full_name}`,
        timestamp: new Date(conn.created_at).toLocaleDateString()
      })) || [];

      setActivities(connectionActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

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
          <p className="text-gray-600 mt-2">Here's what's happening with your study network</p>
        </div>
        <Link href="/profile-setup">
          <Button className="bg-purple-600 hover:bg-purple-700">
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Active Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeConnections}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pendingRequests}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcomingEvents.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
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