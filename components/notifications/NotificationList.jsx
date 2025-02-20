import { useEffect } from 'react';
import NotificationItem from './NotificationItem';
import useNotifications from '../../hooks/useNotifications';

export default function NotificationList() {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  } = useNotifications();

  useEffect(() => {
    console.log("NotificationList state:", { notifications, loading, error });
  }, [notifications, loading, error]);

  if (error) {
    console.error("Error loading notifications:", error);
    return (
      <div className="p-4 text-center text-red-500">
        Error loading notifications. Please try again.
      </div>
    );
  }

  if (loading) {
    console.log("Notifications are loading...");
    return (
      <div className="p-4">
        <div className="flex flex-col space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="space-y-3">
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    console.log("No notifications found.");
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">No notifications yet</p>
      </div>
    );
  }

  const hasUnreadNotifications = notifications.some((n) => !n.is_read);

  console.log("Rendering notifications:", notifications);
  
  return (
    <div className="divide-y divide-gray-200">
      {hasUnreadNotifications && (
        <div className="p-4 bg-gray-50 flex justify-between items-center">
          <span className="text-sm text-gray-600">You have unread notifications</span>
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={markAsRead}
          onActionComplete={refresh}
        />
      ))}
    </div>
  );
}
