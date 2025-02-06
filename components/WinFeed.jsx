'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import NewPostForm from './NewPostForm';
import Post from './Post';

export default function WinFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  const handleNewPost = (newPost) => {
    console.log('Handling new post:', newPost);
    setPosts(currentPosts => [newPost, ...currentPosts]);
  };

  async function loadPosts() {
    try {
      console.log('Loading posts...');
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, name, profile_image)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      console.log('Posts loaded:', postsData);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();

    // Set up real-time subscription
    const postsChannel = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          console.log('Real-time update received:', payload);

          if (payload.eventType === 'INSERT') {
            // Fetch the complete post data including profile
            const { data: newPost, error } = await supabase
              .from('posts')
              .select(`*, profiles!posts_user_id_fkey(id, name, profile_image)`)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching new post:', error);
              return;
            }

            console.log('New post data:', newPost);
            setPosts(currentPosts => [newPost, ...currentPosts]);
          } else if (payload.eventType === 'DELETE') {
            setPosts(currentPosts => 
              currentPosts.filter(post => post.id !== payload.old.id)
            );
          } else if (payload.eventType === 'UPDATE') {
            const { data: updatedPost, error } = await supabase
              .from('posts')
              .select(`*, profiles!posts_user_id_fkey(id, name, profile_image)`)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching updated post:', error);
              return;
            }

            setPosts(currentPosts =>
              currentPosts.map(post =>
                post.id === updatedPost.id ? updatedPost : post
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(postsChannel);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 mb-2">
          Welcome to your feed, {currentUser?.displayName || 'Friend'}!
        </h1>
        <p className="text-surface-500">
          Share your daily wins and celebrate with others.
        </p>
      </div>

      <NewPostForm onPostCreated={handleNewPost} />
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-red-600">Error loading posts: {error}</p>
          <button
            onClick={loadPosts}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-surface-400 text-lg">No wins shared yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              profile={post.profiles}
              user={post.user}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
