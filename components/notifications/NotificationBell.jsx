import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';
import NotificationsDrawer from './NotificationsDrawer';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    let channel;

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await fetchUnreadCount();

        channel = supabase
          .channel('notifications-count')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            () => {
              fetchUnreadCount();
            }
          )
          .subscribe((status) => {
            console.log('Notification count subscription status:', status);
          });

      } catch (error) {
        console.error('Error setting up notification count subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log('Cleaning up notification count subscription');
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      <NotificationsDrawer 
        isOpen={isOpen} 
        onClose={() => {
          setIsOpen(false);
          fetchUnreadCount(); // Refresh count when drawer closes
        }} 
      />
    </>
  );
}
