'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    // Use promise chaining instead of an async IIFE.
    supabase.auth
      .signOut()
      .then(({ error }) => {
        if (error) {
          console.error('Error signing out:', error.message);
        } else {
          router.push('/');
        }
      })
      .catch((err) => {
        console.error('Unexpected error during sign out:', err);
      });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-xl">Signing out...</p>
    </div>
  );
}
