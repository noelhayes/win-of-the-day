'use client';

import { useState, useEffect } from 'react';

export default function FollowButton({ targetUserId, onFollowStateChange }) {
  const [followState, setFollowState] = useState('loading'); // 'loading' | 'following' | 'pending' | 'declined' | 'not_following'
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStatus() {
      console.log('🔍 Fetching follow status for targetUserId:', targetUserId);
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/follows?type=status&targetUserId=${targetUserId}`);
        console.log('📡 Follow status response:', response.status);
        
        if (!response.ok) {
          const errData = await response.json();
          console.error('❌ Follow status error:', errData);
          throw new Error(errData.error || 'Failed to fetch status');
        }
        
        const data = await response.json();
        console.log('✅ Follow status data:', data);
        setFollowState(data.status);
        if (onFollowStateChange) onFollowStateChange(data.status);
      } catch (err) {
        console.error('❌ Error fetching follow status:', err);
        setError(err.message);
        setFollowState('not_following');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (targetUserId) {
      console.log('🎯 FollowButton mounted/updated with targetUserId:', targetUserId);
      fetchStatus();
    }
  }, [targetUserId, onFollowStateChange]);

  const handleToggleFollow = async () => {
    if (followState === 'declined') {
      return; // Do nothing if the request was previously declined
    }

    setIsLoading(true);
    setError(null);
    setMessage('');
    try {
      if (followState === 'following') {
        // Unfollow or cancel pending request
        const response = await fetch('/api/follows', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId })
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to unfollow');
        }
        setFollowState('not_following');
        setMessage('Successfully unfollowed');
        if (onFollowStateChange) onFollowStateChange('not_following');
      } else if (followState === 'not_following') {
        // Send follow request
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId })
        });
        if (!response.ok) {
          const errData = await response.json();
          if (errData.error === 'Follow request already pending') {
            setFollowState('pending');
            setMessage('Follow request already sent');
            if (onFollowStateChange) onFollowStateChange('pending');
            return;
          }
          throw new Error(errData.error || 'Failed to send follow request');
        }
        setFollowState('pending');
        setMessage('Follow request sent');
        if (onFollowStateChange) onFollowStateChange('pending');
      }
    } catch (err) {
      console.error('Error toggling follow state:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    switch (followState) {
      case 'loading':
        return 'Loading...';
      case 'following':
        return (
          <span className="group-hover:hidden">Following</span>
        );
      case 'pending':
        return 'Follow Request Sent';
      case 'declined':
        return 'Follow Request Declined';
      default:
        return 'Follow';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleFollow}
        disabled={isLoading || followState === 'pending' || followState === 'declined'}
        className={`group px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          followState === 'following'
            ? 'bg-gray-200 hover:bg-red-50 hover:text-red-600 hover:before:content-["Unfollow"]'
            : followState === 'pending'
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : followState === 'declined'
            ? 'bg-red-100 text-red-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {getButtonText()}
      </button>
      {message && (
        <div className="absolute top-full mt-2 text-sm text-green-600">{message}</div>
      )}
      {error && (
        <div className="absolute top-full mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}
