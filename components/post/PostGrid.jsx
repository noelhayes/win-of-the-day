'use client';

import { useState } from 'react';
import { Calendar, Grid, List } from 'lucide-react';

export default function PostGrid({ posts }) {
  const [viewMode, setViewMode] = useState('grid');

  const ViewModeButton = ({ mode, icon: Icon, label }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`p-2 rounded-md ${
        viewMode === mode
          ? 'bg-indigo-100 text-indigo-600'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  if (!posts?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2 pb-4">
        <ViewModeButton mode="grid" icon={Grid} label="Grid view" />
        <ViewModeButton mode="list" icon={List} label="List view" />
        <ViewModeButton mode="calendar" icon={Calendar} label="Calendar view" />
      </div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {post.image && (
                <img
                  src={post.image}
                  alt=""
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <p className="text-gray-900 line-clamp-3">{post.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  {post.category && (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: post.category.color + '20',
                        color: post.category.color
                      }}
                    >
                      {post.category.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200"
            >
              <p className="text-gray-900">{post.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                {post.category && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: post.category.color + '20',
                      color: post.category.color
                    }}
                  >
                    {post.category.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            {generateCalendarDays(posts).map((day, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                  day.posts.length
                    ? 'bg-indigo-100 text-indigo-600 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {day.date.getDate()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function generateCalendarDays(posts) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Get the day of week for the first day (0-6)
  const firstDay = start.getDay();
  
  // Create array for all days
  const days = [];
  
  // Add empty days for padding
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: new Date(start.getTime() - ((firstDay - i) * 86400000)), posts: [] });
  }
  
  // Add all days in the month
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    const dayPosts = posts.filter(post => {
      const postDate = new Date(post.created_at);
      return postDate.getDate() === date.getDate() &&
             postDate.getMonth() === date.getMonth() &&
             postDate.getFullYear() === date.getFullYear();
    });
    days.push({ date: new Date(date), posts: dayPosts });
  }
  
  return days;
}
