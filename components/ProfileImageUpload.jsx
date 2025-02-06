'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import Image from 'next/image';

export default function ProfileImageUpload({ userId, currentImageUrl, onImageUpdate }) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const uploadProfileImage = async (event) => {
    try {
      setUploading(true);

      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size should be less than 2MB');
      }

      // Create a unique file path: userId/timestamp-filename
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_images')
        .getPublicUrl(filePath);

      // Update the profile with the new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Delete the old image if it exists
      if (currentImageUrl) {
        try {
          const oldFilePath = currentImageUrl.split('/').slice(-2).join('/');
          await supabase.storage
            .from('profile_images')
            .remove([oldFilePath]);
        } catch (error) {
          // Ignore errors when deleting old images
          console.warn('Failed to delete old image:', error);
        }
      }

      // Notify parent component
      onImageUpdate(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Determine if we should use next/image or regular img
  const isNextImage = currentImageUrl?.startsWith('https://yvdkzqcqmqmgvwxjxiop.supabase.co') || 
                     currentImageUrl?.startsWith('https://lh3.googleusercontent.com') ||
                     currentImageUrl?.startsWith('https://avatars.githubusercontent.com');

  return (
    <div className="relative group">
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-100">
        {currentImageUrl ? (
          isNextImage ? (
            <Image
              src={currentImageUrl}
              alt="Profile"
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <img
              src={currentImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-surface-500">
            {userId.charAt(0).toUpperCase()}
          </div>
        )}
        
        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadProfileImage}
            disabled={uploading}
          />
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          )}
        </label>
      </div>
    </div>
  );
}
