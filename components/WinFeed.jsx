'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export default function WinFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  async function loadPosts() {
    try {
      console.log('Loading posts...');
      
      // First, get all posts with profiles in a single query
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles(id, name, profile_image)
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Posts query error:', postsError);
        throw postsError;
      }

      // Get likes for these posts
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .in('post_id', postsData.map(post => post.id));

      if (likesError) {
        console.error('Likes query error:', likesError);
        throw likesError;
      }

      // Combine the data
      const enrichedPosts = postsData.map(post => ({
        ...post,
        profiles: post.profile, // Use the joined profile data
        likes: likesData.filter(like => like.post_id === post.id)
      }));

      console.log('Posts query result:', { data: enrichedPosts, error: null });
      setPosts(enrichedPosts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();

    // Subscribe to changes
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, (payload) => {
        console.log('Received real-time update:', payload);
        loadPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow p-6">
        <p className="text-red-600">Error loading posts: {error}</p>
        <button
          onClick={loadPosts}
          className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No wins posted yet. Be the first to share your win!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0">
              {post.profiles?.profile_image ? (
                <img
                  src={post.profiles.profile_image}
                  alt={post.profiles.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {post.profiles?.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {post.profiles?.name || 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="prose prose-blue max-w-none mb-4">
            <p className="text-gray-900">{post.content}</p>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <button
              onClick={async () => {
                try {
                  const hasLiked = post.likes?.some(like => like.user_id === currentUser.id);
                  if (hasLiked) return;

                  const { error } = await supabase
                    .from('likes')
                    .insert([{ post_id: post.id, user_id: currentUser.id }]);

                  if (error) throw error;
                  await loadPosts();
                } catch (error) {
                  console.error('Error liking post:', error);
                }
              }}
              className={`flex items-center space-x-2 text-sm font-medium ${
                post.likes?.some(like => like.user_id === currentUser.id)
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <svg
                className="h-5 w-5"
                fill={post.likes?.some(like => like.user_id === currentUser.id) ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              <span>{post.likes?.length || 0} likes</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
