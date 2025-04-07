'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { getSupabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [hasCompleteProfile, setHasCompleteProfile] = useState<boolean>(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          
          // Check if user has a complete profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, faculty, major, courses')
            .eq('user_id', session.user.id)
            .single();

          if (!profileError && profileData) {
            const isProfileComplete = profileData.full_name && 
                                    profileData.faculty && 
                                    profileData.major && 
                                    profileData.courses?.length > 0;
            setHasCompleteProfile(isProfileComplete);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();

    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        setHasCompleteProfile(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // If user is on profile-setup page and doesn't have a complete profile, only show minimal navigation
  const isInitialProfileSetup = pathname === '/profile-setup' && !hasCompleteProfile;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-purple-600">
              UCalgaryConnect
            </Link>
            {user && !isInitialProfileSetup && (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-purple-600">
                  Dashboard
                </Link>
                <Link href="/find-partners" className="text-gray-600 hover:text-purple-600">
                  Find Partners
                </Link>
                <Link href="/connections" className="text-gray-600 hover:text-purple-600">
                  Connections
                </Link>
                <Link href="/events" className="text-gray-600 hover:text-purple-600">
                  Events
                </Link>
                <Link href="/profile-setup" className="text-gray-600 hover:text-purple-600">
                  My Profile
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="text-purple-600 hover:text-purple-700">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 