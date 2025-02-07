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
      
      // Get the list of users the current user follows
      const { data: followedUsers, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      if (followError) throw followError;

      // Create array of user IDs to fetch posts from (followed users + current user)
      const userIds = [
        currentUser.id,
        ...followedUsers.map(follow => follow.following_id)
      ];
      
      // Fetch posts from followed users and self
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          is_private,
          created_at,
          updated_at,
          user_id,
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get profiles for all user_ids
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, profile_image')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles for quick lookup
      const profilesMap = new Map(profilesData.map(profile => [profile.id, profile]));

      // Transform the data to include profile information
      const transformedPosts = postsData.map(post => ({
        ...post,
        profile: profilesMap.get(post.user_id) || {
          id: post.user_id,
          name: 'Anonymous',
          profile_image: null
        }
      }));

      console.log('Posts loaded:', transformedPosts);
      setPosts(transformedPosts);
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
          table: 'posts'
        },
        (payload) => {
          console.log('Change received!', payload);
          loadPosts(); // Reload all posts when any change occurs
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-soft p-5">
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading posts: {error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NewPostForm onPostCreated={handleNewPost} currentUser={currentUser} />
      
      <div className="space-y-4">
        {posts.map(post => (
          <Post 
            key={post.id} 
            post={post}
            profile={post.profile}
            currentUser={currentUser}
          />
        ))}
        
        {posts.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Be the first to share a win!</p>
          </div>
        )}
      </div>
    </div>
  );
}
