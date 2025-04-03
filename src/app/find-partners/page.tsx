'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  name: string;
  faculty: string;
  major: string;
  courses: string[];
  skills: string[];
  interests: string[];
  bio: string;
}

export default function FindPartnersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('is_profile_complete', true);

        if (facultyFilter && facultyFilter !== 'all') {
          query = query.eq('faculty', facultyFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        setProfiles(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [facultyFilter]);

  const filteredProfiles = profiles.filter(profile => {
    if (!searchTerm) return true;

    const searchableText = `${profile.name} ${profile.faculty} ${profile.major} ${profile.bio || ''} ${profile.courses.join(' ')} ${profile.skills.join(' ')}`;
    return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const uniqueFaculties = Array.from(new Set(profiles.map(profile => profile.faculty))).filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-purple-600">Find Partners</h1>

      {/* Search and filter section */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-grow">
          <Input
            placeholder="Search by name, faculty, skills, courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={facultyFilter} onValueChange={setFacultyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {uniqueFaculties.map(faculty => (
                <SelectItem key={faculty} value={faculty}>
                  {faculty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-500 text-center mb-8">{error}</div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12">No users found matching your criteria</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(profile => (
            <Card key={profile.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl text-purple-600">{profile.name}</CardTitle>
                <CardDescription>{profile.faculty} - {profile.major}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {profile.courses && profile.courses.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Courses:</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.courses.map(course => (
                        <Badge key={course} variant="outline">{course}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Skills:</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.skills.map(skill => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Interests:</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.interests.map(interest => (
                        <Badge key={interest} className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.bio && (
                  <div>
                    <h4 className="font-medium mb-2">About:</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Connect
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 