'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WinFeed, NewPostForm } from '../../../components';
import { createClient } from '../../../utils/supabase/client';
import { Loader } from 'lucide-react';

export default function FeedPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shouldRefreshFeed, setShouldRefreshFeed] = useState(0);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      setError(null);
      try {
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.log('No session found, redirecting to home');
          router.replace('/');
          return;
        }

        const userData = session.user;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        if (mounted) {
          setUser({
            ...userData,
            profile: profile || {
              id: userData.id,
              name: userData.email?.split('@')[0] || 'Anonymous',
              email: userData.email
            }
          });
        }
      } catch (err) {
        console.error('Error loading user:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_OUT' || !session?.user) {
        router.replace('/');
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUser();
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  const handleNewPost = () => {
    // Trigger feed refresh by incrementing the key
    setShouldRefreshFeed(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            <div className="absolute inset-0 animate-ping rounded-full bg-primary-100 opacity-75" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-red-50 rounded-2xl text-red-600 border border-red-100">
            <p className="font-medium">Unable to load your feed</p>
            <p className="text-sm mt-1 text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* New Post Form - Sticky at top */}
      <NewPostForm 
        currentUser={user} 
        onPostCreated={handleNewPost}
      />

      {/* Feed - Will only refresh when shouldRefreshFeed changes */}
      <div className="py-4">
        <WinFeed 
          key={shouldRefreshFeed} 
          currentUser={user} 
        />
      </div>
    </div>
  );
}
