'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import ComingSoonToast from './ui/ComingSoonToast';

export default function Post({ post, profile, currentUser, onUpdate }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkIfLiked();
  }, [post.id, currentUser?.id]);

  const checkIfLiked = async () => {
    if (!currentUser?.id || !post.id) return;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

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
    if (!currentUser?.id) {
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);

      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });

        if (error) throw error;
        setLikesCount(prev => prev + 1);
      }

      setIsLiked(!isLiked);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showComingSoon = (feature) => {
    setToastMessage(`${feature} coming soon!`);
    setShowToast(true);
  };

  // If profile is not provided, use the user_id from the post
  const userId = profile?.id || post.user_id;
  const userName = profile?.name || 'Anonymous';
  const profileImage = profile?.profile_image;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const category = post.category;

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-soft overflow-hidden relative"
        style={{
          borderLeft: category ? `4px solid ${category.color}` : undefined,
          boxShadow: category ? `0 4px 6px -1px ${category.color}15, 0 2px 4px -2px ${category.color}10` : undefined
        }}
      >
        <div className="p-5">
          {/* Category and timestamp header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Posted {timeAgo}
              {post.is_private && (
                <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Private
                </span>
              )}
            </span>
            {category && (
              <div 
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color
                }}
              >
                <span className="text-base">{category.icon}</span>
                <span>{category.name}</span>
              </div>
            )}
          </div>

          {/* User info and content */}
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
              <Link 
                href={`/profile/${userId}`}
                className="font-medium text-gray-900 hover:text-primary-600 truncate"
              >
                {userName}
              </Link>

              <p className="mt-2 text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>

              <div className="mt-4 flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  disabled={isLoading}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors duration-200 ${
                    isLiked
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-500 hover:text-gray-600'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg
                    className={`w-5 h-5 ${isLiked ? 'fill-current' : 'stroke-current fill-none'}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                  {likesCount > 0 && (
                    <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {likesCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => showComingSoon('Comments')}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>Comment</span>
                </button>

                <button 
                  onClick={() => showComingSoon('Share')}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ComingSoonToast 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
        message={toastMessage}
      />
    </>
  );
}
