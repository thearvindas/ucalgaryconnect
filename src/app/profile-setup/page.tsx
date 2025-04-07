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
  const [coursesInput, setCoursesInput] = useState('');
  const [courses, setCourses] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch existing profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          return;
        }

        if (profileData) {
          // Populate form with existing data
          setFullName(profileData.full_name || '');
          setFaculty(profileData.faculty || '');
          setMajor(profileData.major || '');
          setCoursesInput(profileData.courses?.join(', ') || '');
          setCourses(profileData.courses || []);
          setBio(profileData.bio || '');
          setSkills(profileData.skills || []);
          setInterests(profileData.interests || []);
        }
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
    const value = e.target.value;
    setCoursesInput(value);
    const courseArray = value
      .split(',')
      .map(course => course.trim())
      .filter(course => {
        // Validate course format: 4 letters + space + 3 numbers
        const isValidFormat = /^[A-Z]{4}\s\d{3}$/.test(course.trim());
        return course !== '' && isValidFormat;
      });
    setCourses(courseArray);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const supabase = getSupabase();
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found. Please log in again.');
      }

      // Validate required fields
      if (!fullName.trim()) throw new Error('Full name is required');
      if (!faculty.trim()) throw new Error('Faculty is required');
      if (!major.trim()) throw new Error('Major is required');

      // Ensure arrays are properly formatted
      const formattedCourses = courses.filter(Boolean);
      const formattedSkills = skills.filter(Boolean);
      const formattedInterests = interests.filter(Boolean);

      // Prepare profile data
      const profileData = {
        user_id: session.user.id,
        full_name: fullName.trim(),
        faculty: faculty.trim(),
        major: major.trim(),
        courses: formattedCourses,
        bio: bio.trim() || null,
        skills: formattedSkills,
        interests: formattedInterests
      };

      // Debug logs
      console.log('Session user ID:', session.user.id);
      console.log('Profile data being sent:', JSON.stringify(profileData, null, 2));

      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', fetchError);
        throw fetchError;
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile...');
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', session.user.id)
          .select()
          .single();
      } else {
        // Insert new profile
        console.log('Creating new profile...');
        result = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Supabase operation error:', result.error);
        throw new Error(`Failed to save profile: ${result.error.message}`);
      }

      console.log('Profile saved successfully:', result.data);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Profile setup error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        setError(error.message as string);
      } else {
        setError('An unexpected error occurred while saving your profile.');
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
                placeholder="e.g., ENTI 674, MGST 611"
                required
              />
              <p className="text-sm text-gray-500">Format: DEPT 123 (e.g., ENTI 674)</p>
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