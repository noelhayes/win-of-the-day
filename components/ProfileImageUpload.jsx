'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

export default function ProfileImageUpload({ currentImage, onUploadComplete, displayName = 'U' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const supabase = createClient();

  const uploadImage = async (event) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;

      // Upload image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update profile
      onUploadComplete(publicUrl);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
      setPreview(null);
    }
  };

  const handleFileChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload the file
    uploadImage(event);
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
    </div>
  );
}
