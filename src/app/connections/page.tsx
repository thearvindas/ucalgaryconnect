'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabase } from '@/lib/supabase';

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
  };
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchConnections = async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session found');
        router.push('/login');
        return;
      }

      console.log('Fetching connections for user:', session.user.id);

      // First, let's test if we can access the connections table
      const { data: testConnections, error: testError } = await supabase
        .from('connections')
        .select('id')
        .or(`user_id.eq.${session.user.id},connected_user_id.eq.${session.user.id}`)
        .limit(1);

      if (testError) {
        console.error('Error testing connections access:', testError);
        throw new Error('Failed to access connections table');
      }

      console.log('Successfully accessed connections table');

      // Now fetch connections with a simpler query first
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${session.user.id},connected_user_id.eq.${session.user.id}`);

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        throw connectionsError;
      }

      console.log('Raw connections data:', connectionsData);

      // If we have connections, fetch the associated profiles
      if (connectionsData && connectionsData.length > 0) {
        const userIds = connectionsData.map(conn => 
          conn.user_id === session.user.id ? conn.connected_user_id : conn.user_id
        );

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        console.log('Profiles data:', profilesData);

        // Combine the data
        const combinedData = connectionsData.map(conn => {
          const profile = profilesData?.find(p => 
            p.user_id === (conn.user_id === session.user.id ? conn.connected_user_id : conn.user_id)
          );
          return {
            ...conn,
            profile: profile || null
          };
        });

        console.log('Combined data:', combinedData);
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
  };

  useEffect(() => {
    fetchConnections();
  }, [router]);

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

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading connections...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-8">My Connections</h1>
      
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Connection Requests ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="connections">My Connections ({connections.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.map(connection => (
              <Card key={connection.id}>
                <CardHeader>
                  <CardTitle>{connection.profile.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">{connection.profile.faculty} - {connection.profile.major}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile.skills.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile.interests.map(interest => (
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
            {pendingRequests.length === 0 && (
              <p className="text-gray-500">No pending connection requests</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map(connection => (
              <Card key={connection.id}>
                <CardHeader>
                  <CardTitle>{connection.profile.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">{connection.profile.faculty} - {connection.profile.major}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile.skills.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {connection.profile.interests.map(interest => (
                          <span key={interest} className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {connections.length === 0 && (
              <p className="text-gray-500">No accepted connections yet</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 