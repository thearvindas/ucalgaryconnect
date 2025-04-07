'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabase } from '@/lib/supabase';
import { Badge } from "@/components/ui/badge";

interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profile: {
    full_name: string;
    faculty: string;
    major: string;
    skills: string[];
    interests: string[];
    courses: string[];
    email?: string;
  };
}

export default function ConnectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'active'>('received');

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'active') {
      setActiveTab('active');
    } else if (tab === 'pending') {
      setActiveTab('received');
    }
  }, [searchParams]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setCurrentUserId(session.user.id);
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/login');
      }
    };

    checkSession();
  }, [router]);

  const fetchConnections = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const supabase = getSupabase();
      
      // Fetch all connections where the user is either the sender or receiver
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${currentUserId},connected_user_id.eq.${currentUserId}`);

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        throw connectionsError;
      }

      // If we have connections, fetch the associated profiles
      if (connectionsData && connectionsData.length > 0) {
        const userIds = connectionsData.map(conn => 
          conn.user_id === currentUserId ? conn.connected_user_id : conn.user_id
        );

        // Get the profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        // Get the current user's data to get their email
        const { data: { user } } = await supabase.auth.getUser();
        
        // Combine the data
        const combinedData = connectionsData.map(conn => {
          const otherUserId = conn.user_id === currentUserId ? conn.connected_user_id : conn.user_id;
          const profile = profilesData?.find(p => p.user_id === otherUserId);
          
          return {
            ...conn,
            profile: profile ? {
              ...profile,
              // For now, we'll use the current user's email as a placeholder
              // In a real app, you'd want to store/fetch the email addresses securely
              email: user?.email || 'contact@ucalgaryconnect.ca'
            } : null
          };
        });

        setConnections(combinedData);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error in fetchConnections:', error);
      setError(error instanceof Error ? error.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchConnections();
    }
  }, [fetchConnections, currentUserId]);

  const handleAccept = async (connectionId: string) => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId)
        .eq('connected_user_id', session.user.id);

      if (error) throw error;

      // Update the local state
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: 'accepted' }
            : conn
        )
      );
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('Failed to accept connection request. Please try again.');
    }
  };

  const handleDecline = async (connectionId: string) => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('connections')
        .update({ status: 'declined' })
        .eq('id', connectionId)
        .eq('connected_user_id', session.user.id);

      if (error) throw error;

      // Update the local state by removing the declined connection
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    } catch (error) {
      console.error('Error declining connection:', error);
      alert('Failed to decline connection request. Please try again.');
    }
  };

  const handleCancel = async (connectionId: string) => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Update the local state by removing the cancelled connection
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    } catch (error) {
      console.error('Error cancelling connection:', error);
      alert('Failed to cancel connection request. Please try again.');
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading connections...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>;
  }

  // Filter connections based on status and user role
  const receivedRequests = connections.filter(conn => 
    conn.connected_user_id === currentUserId && conn.status === 'pending'
  );
  const sentRequests = connections.filter(conn => 
    conn.user_id === currentUserId && conn.status === 'pending'
  );
  const activeConnections = connections.filter(conn => 
    conn.status === 'accepted'
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-8">My Connections</h1>
      
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="received">Pending Requests ({receivedRequests.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent Requests ({sentRequests.length})</TabsTrigger>
          <TabsTrigger value="active">Active Connections ({activeConnections.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receivedRequests.map(connection => (
              <Card key={connection.id}>
                <CardHeader>
                  <CardTitle>{connection.profile?.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">{connection.profile?.faculty} - {connection.profile?.major}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile?.skills.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile?.interests.map(interest => (
                          <span key={interest} className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleAccept(connection.id)}
                      >
                        Accept
                      </Button>
                      <Button 
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => handleDecline(connection.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {receivedRequests.length === 0 && (
              <p className="text-gray-500">No pending requests</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sentRequests.map(connection => (
              <Card key={connection.id}>
                <CardHeader>
                  <CardTitle>{connection.profile?.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">{connection.profile?.faculty} - {connection.profile?.major}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile?.skills.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile?.interests.map(interest => (
                          <span key={interest} className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() => handleCancel(connection.id)}
                    >
                      Cancel Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sentRequests.length === 0 && (
              <p className="text-gray-500">No sent connection requests</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeConnections.map(connection => (
              <Card key={connection.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{connection.profile?.full_name}</CardTitle>
                  <div className="text-sm text-gray-500">
                    {connection.profile?.faculty} - {connection.profile?.major}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile?.skills.map(skill => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile?.interests.map(interest => (
                          <Badge key={interest} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Courses</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile?.courses.map(course => (
                          <Badge key={course} variant="outline">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 mt-4"
                      onClick={() => {
                        const email = connection.profile?.email;
                        if (email) {
                          window.location.href = `mailto:${email}?subject=UCalgaryConnect: Let's connect!`;
                        }
                      }}
                    >
                      Email Partner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {activeConnections.length === 0 && (
              <p className="text-gray-500">No active connections yet</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 