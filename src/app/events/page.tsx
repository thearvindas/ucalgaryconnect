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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*');

        if (eventsError) {
          setError('Failed to fetch events');
          console.error('Error fetching events:', eventsError);
          return;
        }

        setEvents(eventsData || []);
      } catch (error) {
        setError('An unexpected error occurred');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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