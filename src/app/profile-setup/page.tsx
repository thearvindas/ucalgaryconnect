'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabase } from '@/lib/supabase';

const INTERESTS = [
  { id: 'hackathons', label: 'Hackathons' },
  { id: 'group-studying', label: 'Group Studying' },
  { id: 'tutoring', label: 'Tutoring' },
  { id: 'case-competitions', label: 'Case Competitions' },
  { id: 'research', label: 'Research' },
  { id: 'startups', label: 'Startups' },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [courses, setCourses] = useState<string[]>([]);
  const [coursesInput, setCoursesInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUserId(session.user.id);
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/login');
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    // Fetch available skills from Supabase
    async function fetchSkills() {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('skills_master')
        .select('skill_name')
        .order('skill_name');

      if (error) {
        console.error('Error fetching skills:', error);
        return;
      }

      setAvailableSkills((data || []).map(skill => skill.skill_name as string));
    }

    fetchSkills();
  }, []);

  const handleCoursesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoursesInput(e.target.value);
    // Split by comma, trim whitespace, and filter out empty strings
    const courseArray = e.target.value
      .split(',')
      .map(course => course.trim())
      .filter(course => course !== '');
    setCourses(courseArray);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const supabase = getSupabase();
      console.log('Submitting profile data:', {
        user_id: userId,
        full_name: fullName,
        faculty,
        major,
        courses,
        bio,
        skills,
        interests,
      });

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          full_name: fullName,
          faculty,
          major,
          courses,
          bio,
          skills,
          interests,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      router.push('/find-partners');
    } catch (error: unknown) {
      console.error('Profile setup error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        setError(error.message as string);
      } else {
        setError('An unexpected error occurred while saving your profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-purple-600">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Help us match you with the right partners by providing some information about yourself
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <Input
                id="faculty"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="e.g., Haskayne School of Business"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g., Business Analytics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courses">Current Courses (comma separated)</Label>
              <Input
                id="courses"
                value={coursesInput}
                onChange={handleCoursesChange}
                placeholder="e.g., OBHR 674, MGST 611"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map(skill => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill}
                      checked={skills.includes(skill)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSkills([...skills, skill]);
                        } else {
                          setSkills(skills.filter(s => s !== skill));
                        }
                      }}
                    />
                    <Label htmlFor={skill}>{skill}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="grid grid-cols-2 gap-4">
                {INTERESTS.map(interest => (
                  <div key={interest.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest.id}
                      checked={interests.includes(interest.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setInterests([...interests, interest.id]);
                        } else {
                          setInterests(interests.filter(i => i !== interest.id));
                        }
                      }}
                    />
                    <Label htmlFor={interest.id}>{interest.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself, your goals, and what you're looking for in a partner..."
                className="min-h-32"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 