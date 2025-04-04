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
  user_id: string;
  connected_user_id: string;
}

export default function FindPartners() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
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

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!currentUserId) return;

      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // First, get all existing connections (both accepted and pending)
        const { data: connectionsData, error: connectionsError } = await supabase
          .from('connections')
          .select('user_id, connected_user_id')
          .or(`user_id.eq.${session.user.id},connected_user_id.eq.${session.user.id}`);

        if (connectionsError) {
          console.error('Error fetching connections:', connectionsError);
          return;
        }

        // Create a set of all user IDs we're connected with
        const connectedUserIds = new Set(
          connectionsData?.map(conn => 
            conn.user_id === session.user.id ? conn.connected_user_id : conn.user_id
          ) || []
        );

        // Then fetch profiles excluding connected users
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('user_id', session.user.id)
          .not('user_id', 'in', `(${Array.from(connectedUserIds).join(',')})`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProfiles(profiles || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred while fetching profiles');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [currentUserId]);

  const filteredProfiles = profiles.filter(profile => {
    if (!searchTerm) return true;
    const searchableText = `${profile.full_name} ${profile.bio || ''} ${profile.skills.join(' ')}`;
    return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleConnect = async (partnerId: string) => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Check if a connection already exists
      const { data: existingConnection, error: checkError } = await supabase
        .from('connections')
        .select('*')
        .or(`and(user_id.eq.${session.user.id},connected_user_id.eq.${partnerId}),and(user_id.eq.${partnerId},connected_user_id.eq.${session.user.id})`)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingConnection) {
        alert('You already have a connection with this user.');
        return;
      }

      // Create new connection request
      const { error: createError } = await supabase
        .from('connections')
        .insert({
          user_id: session.user.id,
          connected_user_id: partnerId,
          status: 'pending'
        });

      if (createError) throw createError;

      alert('Connection request sent!');
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Input
          placeholder="Search by name, skills, bio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md mx-auto"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map(profile => (
          <Card key={profile.id} className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl text-purple-600">{profile.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {profile.skills && profile.skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Skills:</h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.map(skill => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Interests:</h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.map(interest => (
                      <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio:</h4>
                  <p className="text-gray-600">{profile.bio}</p>
                </div>
              )}

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handleConnect(profile.user_id)}
              >
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 