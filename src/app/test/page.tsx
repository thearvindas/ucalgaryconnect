'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function TestPage() {
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabase();
        const { error } = await supabase.auth.getUser();
        if (error) throw error;
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      }
    }

    checkAuth();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <p className="text-gray-600">{error}</p>
    </div>
  );
} 