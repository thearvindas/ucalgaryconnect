'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabase } from '@/lib/supabase';
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { 
  Users,
  UserPlus,
  UserMinus,
  Mail,
  School,
  BookOpen,
  Briefcase,
  Heart,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';

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

function ClientConnectionsPage() {
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

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'decline' | 'cancel') => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('connections')
        .update({ status: action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'declined' })
        .eq('id', connectionId)
        .eq('connected_user_id', session.user.id);

      if (error) throw error;

      // Update the local state
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'declined' }
            : conn
        )
      );
    } catch (error) {
      console.error(`Error ${action}ing connection:`, error);
      alert(`Failed to ${action} connection request. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-500">Loading connections...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  const receivedRequests = connections.filter(
    conn => conn.connected_user_id === currentUserId && conn.status === 'pending'
  );

  const sentRequests = connections.filter(
    conn => conn.user_id === currentUserId && conn.status === 'pending'
  );

  const activeConnections = connections.filter(
    conn => conn.status === 'accepted'
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-600">Manage your network and connection requests</p>
      </div>

      <Tabs defaultValue={activeTab} className="w-full" onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Received
            {receivedRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{receivedRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sent
            {sentRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{sentRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active
            {activeConnections.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activeConnections.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <div className="grid gap-4">
            {receivedRequests.length > 0 ? (
              receivedRequests.map((connection) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold">{connection.profile.full_name}</h3>
                            <div className="flex items-center gap-2 text-gray-500">
                              <School className="h-4 w-4" />
                              <span>{connection.profile.faculty}</span>
                              <span>•</span>
                              <span>{connection.profile.major}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <div className="flex flex-wrap gap-2">
                                {connection.profile.courses.map((course) => (
                                  <Badge key={course} variant="secondary">{course}</Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-green-600" />
                              <div className="flex flex-wrap gap-2">
                                {connection.profile.skills.map((skill) => (
                                  <Badge key={skill} variant="outline">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-red-600" />
                              <div className="flex flex-wrap gap-2">
                                {connection.profile.interests.map((interest) => (
                                  <Badge key={interest} variant="outline">{interest}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleConnectionAction(connection.id, 'accept')}
                            className="flex items-center gap-2"
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleConnectionAction(connection.id, 'decline')}
                            className="flex items-center gap-2"
                            variant="outline"
                          >
                            <XCircle className="h-4 w-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending connection requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="grid gap-4">
            {sentRequests.length > 0 ? (
              sentRequests.map((connection) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold">{connection.profile.full_name}</h3>
                            <div className="flex items-center gap-2 text-gray-500">
                              <School className="h-4 w-4" />
                              <span>{connection.profile.faculty}</span>
                              <span>•</span>
                              <span>{connection.profile.major}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <div className="flex flex-wrap gap-2">
                                {connection.profile.courses.map((course) => (
                                  <Badge key={course} variant="secondary">{course}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleConnectionAction(connection.id, 'cancel')}
                          className="flex items-center gap-2"
                          variant="outline"
                        >
                          <UserMinus className="h-4 w-4" />
                          Cancel Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending sent requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid gap-4">
            {activeConnections.length > 0 ? (
              activeConnections.map((connection) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold">{connection.profile.full_name}</h3>
                            <div className="flex items-center gap-2 text-gray-500">
                              <School className="h-4 w-4" />
                              <span>{connection.profile.faculty}</span>
                              <span>•</span>
                              <span>{connection.profile.major}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <div className="flex flex-wrap gap-2">
                                {connection.profile.courses.map((course) => (
                                  <Badge key={course} variant="secondary">{course}</Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-green-600" />
                              <div className="flex flex-wrap gap-2">
                                {connection.profile.skills.map((skill) => (
                                  <Badge key={skill} variant="outline">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-red-600" />
                              <div className="flex flex-wrap gap-2">
                                {connection.profile.interests.map((interest) => (
                                  <Badge key={interest} variant="outline">{interest}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => window.location.href = `mailto:${connection.profile.email}`}
                          className="flex items-center gap-2"
                          variant="outline"
                        >
                          <Mail className="h-4 w-4" />
                          Send Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active connections yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
      <ClientConnectionsPage />
    </Suspense>
  );
} 