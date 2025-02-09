'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../utils/supabase/client';
import ProfileImageUpload from '../../../../components/ProfileImageUpload';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '../../../../components/ui/ConfirmModal';

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    username: ''
  });
  const [usernameState, setUsernameState] = useState({
    isChecking: false,
    isValid: false,
    error: null,
    canUpdate: false
  });
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  useEffect(() => {
    loadProfile();
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;

      if (!user) {
        router.push('/login');
        return;
      }

      // Get the user's profile and check if they can update username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, can_update_username:username_updated_at')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        bio: profileData.bio || '',
        username: profileData.username || ''
      });
      setUsernameState(prev => ({
        ...prev,
        isValid: true,
        canUpdate: !profileData.username_updated_at || 
          // If there's an error parsing the date, assume they can't update
          new Date(profileData.username_updated_at).getTime() + (30 * 24 * 60 * 60 * 1000) < Date.now()
      }));
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUsername = (value) => {
    const formatRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
    return formatRegex.test(value);
  };

  const checkUsernameAvailability = async (value) => {
    if (!validateUsername(value)) {
      setUsernameState({
        isChecking: false,
        isValid: false,
        error: 'Username must be 3-20 characters, start with a letter, and contain only letters, numbers, or underscores'
      });
      return;
    }

    // If checking current username, it's valid
    if (value === profile?.username) {
      setUsernameState({
        isChecking: false,
        isValid: true,
        error: null
      });
      return;
    }

    setUsernameState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', value)
        .single();

      if (error && error.code === 'PGRST116') {
        // No match found - username is available
        setUsernameState({
          isChecking: false,
          isValid: true,
          error: null
        });
      } else {
        setUsernameState({
          isChecking: false,
          isValid: false,
          error: 'Username already taken'
        });
      }
    } catch (err) {
      setUsernameState({
        isChecking: false,
        isValid: false,
        error: 'Error checking username availability'
      });
    }
  };

  const handleUsernameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, username: value }));
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const newTimeout = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);

    setDebounceTimeout(newTimeout);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (!profile?.id) {
        throw new Error('No profile found');
      }

      // Check if username is being changed
      if (formData.username !== profile.username) {
        // Verify server-side that the user can update their username
        const { data: canUpdate, error: checkError } = await supabase
          .rpc('check_username_update_eligibility', { user_id: profile.id });

        if (checkError) throw checkError;

        if (!canUpdate) {
          setError('You cannot update your username yet. Please wait 30 days between username changes.');
          setIsLoading(false);
          return;
        }

        if (usernameState.isValid) {
          setShowUsernameModal(true);
          setIsLoading(false);
          return;
        }
      }

      await updateProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    const updates = {
      name: formData.name,
      bio: formData.bio,
      updated_at: new Date().toISOString()
    };

    // Only include username-related fields if it's being changed
    if (formData.username !== profile.username) {
      updates.username = formData.username;
      // Let the database function handle the timestamp
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (updateError) throw updateError;

    setShowUsernameModal(false);
    router.push(`/profile/${profile.id}`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <ProfileImageUpload user={profile} />

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleUsernameChange}
              className="block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {usernameState.isChecking ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-400" />
              ) : formData.username && (
                usernameState.isValid ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )
              )}
            </div>
          </div>
          {usernameState.error && (
            <p className="mt-2 text-sm text-red-600">{usernameState.error}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Display Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || (formData.username !== profile?.username && (!usernameState.isValid || !usernameState.canUpdate))}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onConfirm={updateProfile}
        title="Confirm Username Change"
        message="Are you sure you want to change your username? You can only change it once every 30 days. This will update how others see you across the platform."
      />
    </div>
  );
}
