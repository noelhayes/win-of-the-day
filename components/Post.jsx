'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Post({ post, user, currentUser }) {
  const [isLiking, setIsLiking] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLike() {
    if (isLiking) return;
    setIsLiking(true);
    
    try {
      const { error } = await supabase
        .from('likes')
        .insert([{ post_id: post.id, user_id: currentUser.id }]);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0">
          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{user?.name || 'Anonymous'}</p>
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
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-2 text-sm font-medium ${
            isLiking ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
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
  );
}
