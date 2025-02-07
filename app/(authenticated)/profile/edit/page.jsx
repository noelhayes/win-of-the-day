'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../utils/supabase/client';
import ProfileImageUpload from '../../../../components/ProfileImageUpload';

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // You might store more user details in your custom 'users' table.
        // For now, we assume the user's metadata holds some information.
        setName(session.user.user_metadata.full_name || '');
        setBio(session.user.user_metadata.bio || '');
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    // Update the user's profile in your 'users' table.
    // (You need to ensure your database schema supports these fields.)
    const { error } = await supabase
      .from('users')
      .update({ name, bio })
      .eq('id', user.id);
    if (error) {
      console.error('Error updating profile:', error.message);
    } else {
      router.push(`/profile/${user.id}`);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit Profile</h1>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />
        <label className="block mb-2">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Save
        </button>
      </form>
    </div>
  );
}
