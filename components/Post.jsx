'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function Post({ post, refreshPosts }) {
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [isLiking, setIsLiking] = useState(false);

  async function handleFistBump() {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) {
        setLikes(likes + 1);
        refreshPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <img
                src={post.user?.profileImage || '/default-avatar.png'}
                alt={post.user?.name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">{post.user?.name || 'Anonymous'}</h3>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
              isLiking ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
            onClick={handleFistBump}
            disabled={isLiking}
          >
            <svg
              className={`w-5 h-5 ${isLiking ? 'text-blue-600' : 'text-gray-600'}`}
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
            <span className={`${isLiking ? 'text-blue-600' : 'text-gray-600'}`}>
              {likes} {likes === 1 ? 'Fist Bump' : 'Fist Bumps'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
