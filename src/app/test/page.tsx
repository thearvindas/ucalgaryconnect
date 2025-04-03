'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
  const [message, setMessage] = useState('Testing connection...');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('skills_master')
          .select('*')
          .limit(1);

        if (error) throw error;

        setMessage('Connection successful! Found skills in the database.');
      } catch (error: any) {
        setMessage(`Connection failed: ${error.message}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <p className="text-gray-600">{message}</p>
    </div>
  );
} 