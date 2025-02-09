'use client';

import Image from 'next/image';

export default function ProfileCard({ 
  profile, 
  actionButton,
  size = 'medium', // 'small' | 'medium'
  className = ''
}) {
  const sizeClasses = {
    small: {
      container: 'p-3',
      avatar: 'h-10 w-10',
      text: 'ml-3'
    },
    medium: {
      container: 'p-4',
      avatar: 'h-12 w-12',
      text: 'ml-4'
    }
  };

  const selectedSize = sizeClasses[size];

  return (
    <div className={`flex items-center justify-between ${selectedSize.container} bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors duration-200 ${className}`}>
      <div className="flex items-center min-w-0"> {/* Add min-w-0 to allow text truncation */}
        <div className={`${selectedSize.avatar} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-medium text-white overflow-hidden flex-shrink-0`}>
          {profile.profile_image ? (
            <Image
              src={profile.profile_image}
              alt={profile.name}
              width={size === 'small' ? 40 : 48}
              height={size === 'small' ? 40 : 48}
              className="rounded-full object-cover"
            />
          ) : (
            <span>{profile.name?.charAt(0) || '?'}</span>
          )}
        </div>
        <div className={`${selectedSize.text} min-w-0`}> {/* Add min-w-0 to allow text truncation */}
          <p className="font-medium text-surface-900 truncate">{profile.name}</p>
          <p className="text-sm text-surface-500 truncate">@{profile.username}</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        {actionButton}
      </div>
    </div>
  );
}
