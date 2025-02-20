'use client';

import { useState } from 'react';
import { UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationItem({ notification, onMarkAsRead, onActionComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Initialize from the new field; if not present, default to 'pending'
  const [followRequestStatus, setFollowRequestStatus] = useState(notification.follow_request_status || 'pending');
  const router = useRouter();

  const handleFollowAction = async (action) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/(authenticated)/follows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: notification.reference_id,
          action: action
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to ${action} follow request`);
      }
      
      // Update the local status based on the action taken.
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      setFollowRequestStatus(newStatus);

      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      console.error(`Error ${action}ing follow request:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    if (notification.is_read) return;
    
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationContent = () => {
    // If this is a follow request notification, use the follow_request_status to decide what to display.
    if (
      notification.type === 'follow_request' ||
      notification.type === 'follow_request_accepted' ||
      notification.type === 'follow_request_rejected'
    ) {
      if (followRequestStatus === 'accepted') {
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${notification.trigger_user_id}`} className="font-medium hover:underline">
                {notification.trigger_user?.name || 'A user'}
              </Link>
              <span>is now following you</span>
            </div>
            <div className="text-sm text-green-600">Follow request accepted</div>
          </div>
        );
      }
      if (followRequestStatus === 'rejected') {
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${notification.trigger_user_id}`} className="font-medium hover:underline">
                {notification.trigger_user?.name || 'A user'}
              </Link>
              <span>requested to follow you</span>
            </div>
            <div className="text-sm text-red-600">Follow request declined</div>
          </div>
        );
      }
      // If still pending, show the action buttons.
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${notification.trigger_user_id}`} className="font-medium hover:underline">
              {notification.trigger_user?.name || 'A user'}
            </Link>
            <span>requested to follow you</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleFollowAction('accept')}
              disabled={isLoading}
              className={`px-3 py-1 text-sm rounded-full ${
                isLoading
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Processing...' : 'Accept'}
            </button>
            <button
              onClick={() => handleFollowAction('reject')}
              disabled={isLoading}
              className={`px-3 py-1 text-sm rounded-full ${
                isLoading
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              {isLoading ? 'Processing...' : 'Decline'}
            </button>
          </div>
          {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
        </div>
      );
    }
    // For other types of notifications, simply display the message.
    return notification.message || 'New notification';
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
        !notification.is_read ? 'bg-blue-50/80' : 'bg-white'
      }`}
      onClick={handleMarkAsRead}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleMarkAsRead(e);
        }
      }}
    >
      <div className="flex items-start space-x-4">
        <Link href={`/profile/${notification.trigger_user_id}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {notification.trigger_user?.avatar_url ? (
            <img
              src={notification.trigger_user.avatar_url}
              alt={notification.trigger_user.username}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <UserCircle className="h-10 w-10 text-gray-400" />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{getNotificationContent()}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDistanceToNow(new Date(notification.created_at))}</p>
        </div>
        {!notification.is_read && (
          <div className="flex-shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
