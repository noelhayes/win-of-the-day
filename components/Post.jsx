'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Post({ post, profile, currentUser }) {
  const [isLiked, setIsLiked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    // Like functionality will be implemented later
  };

  // If profile is not provided, use the user_id from the post
  const userId = profile?.id || post.user_id;
  const userName = profile?.name || 'Anonymous';
  const profileImage = profile?.profile_image;

  return (
    <div className="bg-white rounded-xl shadow-soft p-5 mb-4">
      <div className="flex items-start space-x-4">
        <Link href={`/profile/${userId}`} className="flex-shrink-0">
          <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-medium text-white hover:opacity-90 transition-opacity duration-200 overflow-hidden">
            {profileImage ? (
              profileImage.startsWith('https://') ? (
                <Image
                  src={profileImage}
                  alt={userName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <img
                  src={profileImage}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              )
            ) : (
              <span>{getInitials(userName)}</span>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Link 
              href={`/profile/${userId}`}
              className="font-medium text-surface-900 hover:text-primary-500 transition-colors duration-200"
            >
              {userName}
            </Link>
            <span className="text-surface-400 text-sm">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <p className="mt-2 text-surface-600 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1.5 text-sm font-medium transition-colors duration-200 ${
                isLiked
                  ? 'text-primary-500'
                  : 'text-surface-400 hover:text-primary-500'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
