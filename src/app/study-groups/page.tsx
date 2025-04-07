'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from 'react';

interface StudyGroup {
  id: string;
  name: string;
  course: string;
  description: string;
  meeting_time: string;
  location: string;
  max_participants: number;
  current_participants: number;
  created_by: string;
}

export default function StudyGroups() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const SAMPLE_GROUPS = [
    {
      id: '1',
      name: 'CPSC 471 Database Study Group',
      course: 'CPSC 471',
      description: 'Weekly study sessions focusing on database design and SQL',
      meeting_time: '2024-04-15T15:00:00',
      location: 'TFDL 3rd Floor Study Room 2',
      max_participants: 6,
      current_participants: 4,
      created_by: 'John Smith'
    },
    {
      id: '2',
      name: 'Calculus II Group',
      course: 'MATH 267',
      description: 'Practice problems and concept review for upcoming midterm',
      meeting_time: '2024-04-16T14:00:00',
      location: 'MS Building Room 317',
      max_participants: 5,
      current_participants: 3,
      created_by: 'Sarah Chen'
    },
    {
      id: '3',
      name: 'ENGG 201 Problem Solving',
      course: 'ENGG 201',
      description: 'Working through practice problems and past exams',
      meeting_time: '2024-04-17T16:00:00',
      location: 'ENG Building Study Area',
      max_participants: 8,
      current_participants: 5,
      created_by: 'Michael Brown'
    }
  ];

  useEffect(() => {
    setGroups(SAMPLE_GROUPS);
  }, [SAMPLE_GROUPS]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="container mx-auto px-4 py-8">Loading study groups...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-600">Study Groups</h1>
          <p className="text-gray-600 mt-2">Join or create study groups with your peers</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          Create New Group
        </Button>
      </div>

      <div className="mb-8">
        <Input
          type="text"
          placeholder="Search study groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {group.course}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(group.meeting_time).toLocaleString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {group.location}
                </div>
                <p className="text-sm text-gray-600">{group.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Created by {group.created_by}</span>
                  <span>{group.current_participants}/{group.max_participants} members</span>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Join Group
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No study groups found matching your search.</p>
        </div>
      )}
    </div>
  );
} 