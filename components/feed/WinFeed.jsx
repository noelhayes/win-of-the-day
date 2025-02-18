'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Post } from '../../components';
import { Loader2 } from 'lucide-react';

export default function WinFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    if (currentUser) {
      loadPosts();
      // Set up real-time subscription for posts and likes
      const postsSubscription = supabase
        .channel('posts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts',
          },
          (payload) => {
            console.log('Posts change received:', payload);
            loadPosts();
          }
        )
        .subscribe();

      const likesSubscription = supabase
        .channel('likes-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'likes',
          },
          (payload) => {
            console.log('Likes change received:', payload);
            loadPosts();
          }
        )
        .subscribe();

      return () => {
        postsSubscription.unsubscribe();
        likesSubscription.unsubscribe();
      };
    }
  }, [currentUser]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First get the list of users the current user follows
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      if (followError) throw followError;

      // Get array of followed user IDs plus the current user's ID
      const userIds = [currentUser.id, ...(followData?.map(f => f.following_id) || [])];

      // Get posts with profile, category, and likes count
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          category:categories!posts_category_id_fkey (
            id,
            name,
            color,
            icon
          ),
          likes:likes(count)
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get profiles for the posts
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, profile_image')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles for quick lookup
      const profilesMap = new Map(profilesData.map(profile => [profile.id, profile]));

      // Transform posts to include profile, category, and likes count
      const postsWithData = postsData.map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id),
        likes_count: post.likes?.[0]?.count || 0
      }));

      console.log('Posts with data:', postsWithData);
      setPosts(postsWithData);

    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostUpdate = () => {
    loadPosts();
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-red-50 rounded-2xl text-red-600 text-center border border-red-100">
          <p className="font-medium">Unable to load your feed</p>
          <p className="text-sm mt-1 text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <div className="absolute inset-0 animate-ping rounded-full bg-primary-100 opacity-75" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-gray-500 mt-4 font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 sm:px-0">
        {/* Feed Header */}
        <div className="flex items-center justify-between my-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Your Feed
          </h1>
          <div className="flex items-center space-x-2">
            {/* Add any feed controls here if needed */}
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-center py-16">
              <div className="max-w-sm mx-auto px-6">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your First Win!</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Start by sharing your achievements or follow others to see their wins in your feed.
                </p>
                <button
                  onClick={() => document.querySelector('textarea')?.focus()}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Share Your Win
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                profile={post.profiles}
                currentUser={currentUser}
                onUpdate={handlePostUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
