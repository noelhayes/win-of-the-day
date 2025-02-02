'use client';

import { useState, useEffect } from 'react';
import NewPostForm from '../../components/NewPostForm';
import Post from '../../components/Post';
import { useSupabase } from '../../lib/supabaseClient';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useSupabase();

  async function fetchPosts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(
            id,
            name,
            profileImage,
            username
          ),
          likes(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscription for new posts
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:max-w-3xl lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed</h1>
          <p className="text-gray-600">Share and celebrate your daily wins!</p>
        </div>

        {/* New Post Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
          <NewPostForm onPostCreated={fetchPosts} />
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchPosts}
                className="mt-2 text-red-600 hover:text-red-500 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No posts yet. Be the first to share your win!</p>
            </div>
          ) : (
            posts.map((post) => (
              <Post key={post.id} post={post} refreshPosts={fetchPosts} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
