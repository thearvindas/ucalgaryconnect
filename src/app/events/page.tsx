'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ChevronRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSupabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  created_by: string;
  created_at: string;
  url: string | null;
}

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session, redirecting to login');
        router.push('/login');
        return;
      }

      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setUpcomingEvents([]);
        return;
      }

      if (!eventsData) {
        console.log('No events data returned');
        setUpcomingEvents([]);
        return;
      }

      const formattedEvents = eventsData.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.start_date),
        time: format(new Date(event.start_date), 'hh:mm a'),
        location: event.location || 'Location TBD',
        description: event.description,
        created_by: event.created_by,
        created_at: event.created_at,
        url: event.url ? (event.url.startsWith('http://') || event.url.startsWith('https://') ? event.url : `https://${event.url}`) : null
      }));

      console.log('Formatted events:', formattedEvents);
      setUpcomingEvents(formattedEvents);
    } catch (error) {
      console.error('Unexpected error:', error);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-500">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Upcoming Events</h1>
        <p className="text-gray-600">Stay updated with the latest events and activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      {event.description && (
                        <div className="flex items-start gap-2 text-gray-600 mt-2">
                          <Info className="h-4 w-4 flex-shrink-0 mt-1" />
                          <p className="text-sm">{event.description}</p>
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={() => {
                        if (event.url) {
                          window.open(event.url, '_blank', 'noopener,noreferrer');
                        } else {
                          router.push(`/events/${event.id}`);
                        }
                      }}
                      className={`w-full flex items-center justify-center gap-2 ${event.url ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    >
                      {event.url ? 'Visit Event' : 'View Details'}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming events found</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 