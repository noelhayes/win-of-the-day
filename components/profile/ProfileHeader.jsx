'use client';

import { useState } from 'react';
import { createClient } from '../../utils/supabase/client';
import { ProfileImageUpload } from '../../components';

export default function ProfileHeader({ profile, isOwnProfile }) {
  const [profileImage, setProfileImage] = useState(profile.profile_image);
  const supabase = createClient();

  const handleImageUpdate = (newImageUrl) => {
    setProfileImage(newImageUrl);
  };

  return (
    <div className="relative bg-white rounded-xl shadow-soft p-6 mb-6">
      <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        {isOwnProfile ? (
          <ProfileImageUpload
            userId={profile.id}
            currentImageUrl={profileImage}
            onImageUpdate={handleImageUpdate}
          />
        ) : (
          <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-100">
            {profileImage ? (
              <img
                src={profileImage}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-surface-500">
                {profile.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-surface-900">{profile.name}</h1>
            <p className="text-surface-500">@{profile.username}</p>
          </div>
          
          {isOwnProfile ? (
            <button className="mt-4 px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-600 rounded-lg text-sm font-medium transition-colors duration-200">
              Edit Profile
            </button>
          ) : (
            <button className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors duration-200">
              Add Friend
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
