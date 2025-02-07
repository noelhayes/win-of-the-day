'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import FollowButton from '../../../../components/FollowButton';
import { createClient } from '../../../../utils/supabase/client';

export default function ProfilePage() {
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const supabase = createClient();

  async function fetchProfile() {
    // Fetch user info from Supabase (assumes a "users" table)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) {
      setUserProfile(data);
    }
  }

  async function fetchPosts() {
    // Fetch posts by the user
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    if (!error) {
      setPosts(data);
    }
  }

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [userId]);

  if (!userProfile) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center mb-4">
        <img
          src={userProfile.profileImage || '/default-avatar.png'}
          alt="Avatar"
          className="w-16 h-16 rounded-full mr-4"
        />
        <div>
          <h2 className="text-2xl font-bold">{userProfile.name}</h2>
          <p>{userProfile.bio}</p>
        </div>
        <div className="ml-auto">
          <FollowButton targetUserId={userId} />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Wins</h3>
        {posts.map((post) => (
          <div key={post.id} className="border p-4 rounded mb-2">
            <p>{post.content}</p>
            <small>{new Date(post.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
