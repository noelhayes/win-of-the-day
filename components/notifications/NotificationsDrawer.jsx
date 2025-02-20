'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useNotifications from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

export default function NotificationsDrawer({ isOpen, onClose }) {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  } = useNotifications();

  // Group notifications by type
  const followRequests = notifications?.filter(n => 
    n.type === 'follow_request' && (!n.follow_request_status || n.follow_request_status === 'pending')
  ) || [];
  
  const otherNotifications = notifications?.filter(n => 
    n.type !== 'follow_request' || (n.type === 'follow_request' && n.follow_request_status && n.follow_request_status !== 'pending')
  ) || [];

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="sticky top-0 z-10 bg-white px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                          Notifications
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {error ? (
                      <div className="p-4 text-center text-red-500">
                        Failed to load notifications. Please try again.
                      </div>
                    ) : loading ? (
                      <div className="p-4 space-y-4">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="animate-pulse flex space-x-4">
                            <div className="rounded-full bg-gray-200 h-10 w-10" />
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-2 bg-gray-200 rounded" />
                              <div className="h-2 bg-gray-200 rounded w-3/4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifications?.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      <div className="relative">
                        {unreadCount > 0 && (
                          <div className="sticky top-0 bg-gray-50 p-4 flex justify-between items-center border-b border-gray-200">
                            <span className="text-sm text-gray-600">
                              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={markAllAsRead}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Mark all as read
                            </button>
                          </div>
                        )}

                        {followRequests.length > 0 && (
                          <div className="border-b border-gray-200">
                            <h3 className="px-4 py-3 text-sm font-medium text-gray-500 bg-gray-50">
                              Follow Requests
                            </h3>
                            <div className="divide-y divide-gray-200">
                              {followRequests.map((notification) => (
                                <NotificationItem
                                  key={notification.id}
                                  notification={notification}
                                  onMarkAsRead={markAsRead}
                                  onActionComplete={refresh}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {otherNotifications.length > 0 && (
                          <div>
                            <h3 className="px-4 py-3 text-sm font-medium text-gray-500 bg-gray-50">
                              Other Notifications
                            </h3>
                            <div className="divide-y divide-gray-200">
                              {otherNotifications.map((notification) => (
                                <NotificationItem
                                  key={notification.id}
                                  notification={notification}
                                  onMarkAsRead={markAsRead}
                                  onActionComplete={refresh}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
