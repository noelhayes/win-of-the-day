'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';

export default function FollowButton({ targetUserId, initialIsFollowing = false }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const toggleFollow = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User must be logged in to follow/unfollow');
        return;
      }

      // The auth user ID is the same as the profile ID
      const currentProfileId = user.id;
      console.log('Current profile ID:', currentProfileId);
      console.log('Target user ID:', targetUserId);
      console.log('Current follow state:', isFollowing);

      if (isFollowing) {
        console.log('Attempting to unfollow...');
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ 
            follower_id: currentProfileId, 
            following_id: targetUserId 
          });

        if (error) {
          console.error('Error unfollowing:', error);
          return;
        }
        console.log('Unfollow successful');
      } else {
        console.log('Attempting to follow...');
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert([
            { 
              follower_id: currentProfileId, 
              following_id: targetUserId 
            }
          ]);

        if (error) {
          console.error('Error following:', error);
          return;
        }
        console.log('Follow successful');
      }

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
        isFollowing
          ? 'bg-gray-100 text-gray-800 hover:bg-red-50 hover:text-red-600'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
      ) : isFollowing ? (
        'Following'
      ) : (
        'Follow'
      )}
    </button>
  );
}