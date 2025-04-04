'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase } from '@/lib/supabase';
import { Calendar } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchEvents = async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session found');
        router.push('/login');
        return;
      }

      console.log('Fetching events...');

      // First, let's just try to fetch all events without ordering
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*');

      if (error) {
        console.error('Error fetching events:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Raw events data:', eventsData);

      // Sort events after fetching
      const sortedEvents = eventsData?.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Format events
      const formattedEvents = sortedEvents?.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.date).toLocaleDateString(),
        time: new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: event.location || 'Location TBD',
        description: event.description || ''
      })) || [];

      console.log('Formatted events:', formattedEvents);
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading events...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-600">Upcoming Events</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date} at {event.time}</span>
                </div>
                <div className="text-gray-600">
                  <p>{event.location}</p>
                </div>
                {event.description && (
                  <div className="text-gray-600">
                    <p>{event.description}</p>
                  </div>
                )}
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No upcoming events found</p>
          </div>
        )}
      </div>
    </div>
  );
} 