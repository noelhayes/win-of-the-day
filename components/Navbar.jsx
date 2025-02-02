// components/Navbar.jsx
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get the current session on mount
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }
    getSession();

    // Listen to auth state changes
    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="flex items-center justify-between bg-gray-100 p-4">
      <Link href="/">
        <span className="text-xl font-bold cursor-pointer">WofD</span>
      </Link>
      <div className="flex items-center space-x-4">
        <Link href="/feed">
          <span className="cursor-pointer">Feed</span>
        </Link>
        {session ? (
          <Link href="/sign-out">
            <span className="cursor-pointer">Logout</span>
          </Link>
        ) : (
          <Link href="/sign-in">
            <span className="cursor-pointer">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
