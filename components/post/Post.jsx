'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Heart } from 'lucide-react';
import EditPostForm from './EditPostForm';
import ComingSoonToast from '../ui/ComingSoonToast';
import Modal from '../ui/Modal';
import PostMenu from '../ui/PostMenu';
import DeletePostDialog from '../ui/DeletePostDialog';

export default function Post({ post, profile, currentUser, onUpdate }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [likesList, setLikesList] = useState([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check if the current user already liked the post
  useEffect(() => {
    checkIfLiked();
  }, [post.id, currentUser?.id]);

  const fetchLikes = async () => {
    if (!post.id || isLoadingLikes) return;
    setIsLoadingLikes(true);
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          user_id,
          profiles (
            id,
            name
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLikesList(data || []);
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setIsLoadingLikes(false);
    }
  };

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

  const handleEditSave = (updatedPost) => {
    setShowEditModal(false);
    if (onUpdate) onUpdate();
  };

  const handleDelete = async () => {
    if (!currentUser?.id || !post.id) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      setShowDeleteDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting post:', error);
      setToastMessage('Failed to delete post. Please try again.');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  // If profile is not provided, use the user_id from the post
  const userId = profile?.id || post.user_id;
  const userName = profile?.name || 'Anonymous';
  const profileImage = profile?.profile_image;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const category = post.category;
  const isOwner = currentUser?.id === post.user_id;
  const wasEdited = post.updated_at && post.updated_at !== post.created_at;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow transition-all duration-200 border border-gray-200">
      {/* Header with user info and category */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <Link href={`/profile/${userId}`} className="block">
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-lg font-medium text-primary-600 ring-2 ring-white group-hover:ring-primary-50 transition-all duration-200">
                {userName[0]}
              </div>
              {category && (
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-sm ring-2 ring-white"
                  style={{
                    backgroundColor: category.color,
                    color: 'white',
                  }}
                >
                  {category.icon}
                </div>
              )}
            </div>
          </Link>
          
          {/* User info and timestamp */}
          <div className="flex flex-col">
            <Link href={`/profile/${userId}`} className="font-semibold text-gray-900 hover:text-primary-500 transition-colors duration-200">
              {userName}
            </Link>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              {wasEdited && (
                <span className="ml-1 text-gray-400">(edited)</span>
              )}
            </span>
          </div>
        </div>

        {/* Post menu */}
        {currentUser?.id === userId && (
          <div className="relative">
            <PostMenu 
              onEdit={() => setShowEditModal(true)}
              onDelete={() => setShowDeleteDialog(true)} 
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div
            className="relative inline-block"
            onMouseEnter={() => {
              fetchLikes();
              setShowTooltip(true);
            }}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={`group flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isLiked 
                  ? 'bg-red-50 text-red-500' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked 
                    ? 'fill-current' 
                    : 'group-hover:text-red-500'
                } ${isLoading ? 'opacity-50' : ''}`}
              />
              <span className={isLiked ? '' : 'group-hover:text-gray-900'}>
                {likesCount}
              </span>
            </button>
            {showTooltip && likesCount > 0 && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-10 shadow-xl">
                {isLoadingLikes
                  ? 'Loading...'
                  : likesList.map((like) => like.profiles.name).join(', ')}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeletePostDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Post"
      >
        <EditPostForm
          post={post}
          onSave={handleEditSave}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
}
