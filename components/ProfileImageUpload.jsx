'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfileImageUpload({ currentImage, onUploadComplete, displayName = 'U' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const supabase = createClient();

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      setError(null);

      if (!file) {
        throw new Error('No file selected');
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Create a unique file name
      const fileExt = file.type.split('/')[1];
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // First check if the bucket exists and is accessible
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('profile-images');

      if (bucketError) {
        console.error('Bucket error:', bucketError);
        throw new Error('Storage system is not properly configured');
      }

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      // Update profile with new image URL
      onUploadComplete(urlData.publicUrl);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Error uploading image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload the file
    await uploadImage(file);

    // Clean up preview URL
    return () => URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="relative h-full w-full">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        aria-label="Upload profile image"
      />
      
      {currentImage || preview ? (
        <div className="relative w-full h-full">
          <Image
            src={preview || currentImage}
            alt="Profile"
            fill
            className="rounded-xl border-4 border-white shadow-lg object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 rounded-xl flex items-center justify-center">
            <Upload className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-all duration-200" />
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-indigo-100 rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
          <span className="text-4xl font-bold text-indigo-600">
            {displayName[0].toUpperCase()}
          </span>
        </div>
      )}
      
      {error && (
        <div className="absolute -bottom-8 left-0 right-0 text-center text-sm bg-red-50 text-red-500 p-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
