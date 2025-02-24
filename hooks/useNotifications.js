import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('Authentication error');
      if (!user) throw new Error('No authenticated user found');

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select(`
          *,
          trigger_user:profiles!notifications_trigger_user_fkey(
            id,
            username,
            name,
            profile_image
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setNotifications(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to mark notification as read');
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('Error in markAsRead:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to mark all notifications as read');
      }
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Error in markAllAsRead:', err);
      throw err;
    }
  };

  const acceptFollowRequest = async (notificationId, followRequestId) => {
    try {
      const response = await fetch('/api/follows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: followRequestId,
          action: 'accept'
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to accept follow request');
      }
      // Optionally mark the notification as read after accepting
      await markAsRead(notificationId);
      // Refresh the notifications list if needed
      await fetchNotifications();
    } catch (err) {
      console.error('Error accepting follow request:', err);
      throw err;
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let channel;

    const setupSubscription = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user || !isSubscribed) return;

        channel = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              if (!isSubscribed) return;
              // For INSERT, UPDATE, and DELETE events, update local state using the payload data.
              if (payload.eventType === 'INSERT') {
                setNotifications((prev) => [payload.new, ...prev]);
              } else if (payload.eventType === 'DELETE') {
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== payload.old.id)
                );
              } else if (payload.eventType === 'UPDATE') {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === payload.new.id ? payload.new : n
                  )
                );
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Error in setupSubscription:', err);
      }
    };

    fetchNotifications();
    setupSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    acceptFollowRequest,
    refresh: fetchNotifications
  };
}
