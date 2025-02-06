'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NewPostForm from '../../components/NewPostForm';
import WinFeed from '../../components/WinFeed';
import { createClient } from '../../utils/supabase/client';

export default function FeedPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        // Get user data
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        if (!userData || userError) {
          router.push('/');
          return;
        }

        // Get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userData.id)
          .single();

        const name = profile?.name || userData.email?.split('@')[0] || 'there';
        setUser({ ...userData, displayName: name });
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  // Redirect if no user
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      <WinFeed currentUser={user} />
    </div>
  );
}
