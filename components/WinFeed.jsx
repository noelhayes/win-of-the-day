'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import Post from './Post';
import { Loader2 } from 'lucide-react';
import NewPostForm from './NewPostForm';

export default function WinFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    if (currentUser) {
      loadPosts();
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

      // Get posts with profile and category information
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          category:categories!posts_category_id_fkey (
            id,
            name,
            color,
            icon
          )
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

      // Transform posts to include profile and category
      const postsWithData = postsData.map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id)
      }));

      console.log('Posts with categories:', postsWithData);
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

  const handleNewPost = (newPost) => {
    console.log('Handling new post:', newPost);
    setPosts(currentPosts => [newPost, ...currentPosts]);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading posts: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No posts yet.</p>
        <p className="text-sm text-gray-400 mt-2">
          Follow some users or create your first post!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NewPostForm onPostCreated={handleNewPost} currentUser={currentUser} />
      {posts.map(post => (
        <Post 
          key={post.id} 
          post={post}
          profile={post.profiles}
          currentUser={currentUser}
          onUpdate={handlePostUpdate}
        />
      ))}
    </div>
  );
}
