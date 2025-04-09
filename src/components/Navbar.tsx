'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { getSupabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Badge } from "@/components/ui/badge";
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [hasCompleteProfile, setHasCompleteProfile] = useState<boolean>(false);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', session);
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

          // Fetch pending connection requests
          const { data: connectionsData, error: connectionsError } = await supabase
            .from('connections')
            .select('*')
            .eq('connected_user_id', session.user.id)
            .eq('status', 'pending');

          if (!connectionsError) {
            console.log('Pending requests:', connectionsData?.length || 0);
            setPendingRequests(connectionsData?.length || 0);
          } else {
            console.error('Error fetching pending requests:', connectionsError);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();

    const supabase = getSupabase();
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session);
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        setHasCompleteProfile(false);
        setPendingRequests(0);
      }
    });

    // Subscribe to connection changes
    if (user?.id) {
      console.log('Setting up real-time subscription for user:', user.id);
      const connectionsSubscription = supabase
        .channel('connections')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connections',
            filter: `connected_user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Connection change detected:', payload);
            if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
              setPendingRequests(prev => prev + 1);
            } else if (payload.eventType === 'UPDATE' && payload.new.status !== 'pending') {
              setPendingRequests(prev => Math.max(0, prev - 1));
            } else if (payload.eventType === 'DELETE') {
              setPendingRequests(prev => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();

      return () => {
        authSubscription.unsubscribe();
        connectionsSubscription.unsubscribe();
      };
    }

    return () => {
      authSubscription.unsubscribe();
    };
  }, [user?.id]);

  // Add a debug log for the user state
  console.log('Current user state:', user);

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

  const NavItems = () => (
    <>
      <Link href="/dashboard" className="text-gray-600 hover:text-purple-600">
        Dashboard
      </Link>
      <Link href="/find-partners" className="text-gray-600 hover:text-purple-600">
        Find Partners
      </Link>
      <Link href="/connections" className="text-gray-600 hover:text-purple-600 relative">
        Connections
        {pendingRequests > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
          >
            {pendingRequests}
          </Badge>
        )}
      </Link>
      <Link href="/events" className="text-gray-600 hover:text-purple-600">
        Events
      </Link>
      <Link href="/profile-setup" className="text-gray-600 hover:text-purple-600">
        My Profile
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link 
              href={user ? "/dashboard" : "/"} 
              className="text-xl font-bold text-purple-600 hover:text-purple-700"
              onClick={(e) => {
                e.preventDefault();
                if (user) {
                  router.push('/dashboard');
                } else {
                  router.push('/');
                }
              }}
            >
              UCalgaryConnect
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user && !isInitialProfileSetup && (
              <div className="flex items-center space-x-4">
                <NavItems />
              </div>
            )}
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-purple-600 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user && !isInitialProfileSetup && (
                <div className="flex flex-col space-y-2">
                  <NavItems />
                </div>
              )}
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
                {user ? (
                  <>
                    <span className="text-sm text-gray-600 px-2">
                      {user.email}
                    </span>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 w-full"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="w-full">
                      <Button variant="outline" className="text-purple-600 hover:text-purple-700 w-full">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" className="w-full">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 