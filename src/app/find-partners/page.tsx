'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getSupabase } from '@/lib/supabase';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  skills: string[];
  interests: string[];
  created_at: string;
  updated_at: string;
  faculty: string;
  major: string;
  courses: string[];
}

interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function FindPartners() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'courses' | 'interests' | 'skills'>('all');

  useEffect(() => {
    const checkSessionAndFetchPartners = async () => {
      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const supabase = getSupabase();
        
        // Fetch all connections
        const { data: connectionsData, error: connectionsError } = await supabase
          .from('connections')
          .select('*')
          .or(`user_id.eq.${session.user.id},connected_user_id.eq.${session.user.id}`);

        if (connectionsError) {
          console.error('Error fetching connections:', connectionsError);
          return;
        }

        setConnections(connectionsData || []);

        // Fetch all profiles except current user
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .neq('user_id', session.user.id);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        setProfiles(profiles || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndFetchPartners();
  }, [router]);

  const filteredProfiles = profiles.filter(profile => {
    // First check if we're already connected with this user
    const isConnected = connections.some(conn => 
      (conn.user_id === profile.user_id || conn.connected_user_id === profile.user_id) &&
      conn.status === 'accepted'
    );

    if (isConnected) return false;

    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    switch (searchType) {
      case 'courses':
        return profile.courses.some(course => 
          course.toLowerCase().includes(searchLower)
        );
      case 'interests':
        return profile.interests.some(interest => 
          interest.toLowerCase().includes(searchLower)
        );
      case 'skills':
        return profile.skills.some(skill => 
          skill.toLowerCase().includes(searchLower)
        );
      default:
        const searchableText = `${profile.full_name} ${profile.bio || ''} ${profile.skills.join(' ')} ${profile.interests.join(' ')} ${profile.courses.join(' ')}`;
        return searchableText.toLowerCase().includes(searchLower);
    }
  });

  const getConnectionStatus = (profileId: string) => {
    const connection = connections.find(conn => 
      (conn.user_id === profileId || conn.connected_user_id === profileId)
    );
    return connection?.status || null;
  };

  const handleConnect = async (partnerId: string) => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Create new connection request
      const { data: newConnection, error: createError } = await supabase
        .from('connections')
        .insert({
          user_id: session.user.id,
          connected_user_id: partnerId,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Update local state
      setConnections(prev => [...prev, newConnection]);
    } catch (error) {
      console.error('Error connecting with partner:', error);
      alert('Failed to send connection request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Study Partners</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'all' | 'courses' | 'interests' | 'skills')}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All</option>
            <option value="courses">Courses</option>
            <option value="interests">Interests</option>
            <option value="skills">Skills</option>
          </select>
        </div>
        <p className="text-sm text-gray-500">
          {searchType === 'all' ? 'Searching across all fields' : 
           `Searching in ${searchType}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map(profile => {
          const connectionStatus = getConnectionStatus(profile.user_id);
          
          return (
            <Card key={profile.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>{profile.full_name}</CardTitle>
                <div className="text-sm text-gray-500">
                  {profile.faculty} - {profile.major}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  {profile.bio && (
                    <p className="text-gray-600">{profile.bio}</p>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map(skill => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map(interest => (
                        <Badge key={interest} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Courses</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.courses.map(course => (
                        <Badge key={course} variant="outline">
                          {course}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardContent>
                {connectionStatus === 'accepted' ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                    Connected
                  </Button>
                ) : connectionStatus === 'pending' ? (
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700" disabled>
                    Request Sent
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleConnect(profile.user_id)}
                  >
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 