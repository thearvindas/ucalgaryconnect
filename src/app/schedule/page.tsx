'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SchedulePage() {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    description: '',
    participants: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement session scheduling logic
    console.log('Session details:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">Schedule a Study Session</h1>
        <p className="text-gray-600 mb-8">Plan a study session with your peers</p>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., CPSC 471 Midterm Review"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    placeholder="e.g., 60"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., TFDL 3rd Floor"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what you'll be studying..."
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants">Invite Participants (email addresses)</Label>
                <Input
                  id="participants"
                  name="participants"
                  placeholder="Enter email addresses separated by commas"
                  value={formData.participants}
                  onChange={handleChange}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Schedule Session
              </Button>
            </CardContent>
          </Card>
        </form>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Your Upcoming Sessions</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center">No upcoming sessions scheduled.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 