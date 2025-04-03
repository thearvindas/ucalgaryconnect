'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  skills: string[];
  interests: string[];
  created_at: string;
  updated_at: string;
}

export default function FindPartners() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('user_id', user.id);

        if (error) throw error;
        setProfiles(data || []);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [router]);

  const filteredProfiles = profiles.filter(profile => {
    if (!searchTerm) return true;
    const searchableText = `${profile.full_name} ${profile.bio || ''} ${profile.skills.join(' ')}`;
    return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 