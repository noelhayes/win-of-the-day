'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { 
  ProfileHeader, 
  ProfileStats,
  GoalsList, 
  FriendsList, 
  ProductivityDashboard,
  PostGrid,
  ComingSoonToast 
} from '../../../components';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        
        if (!userData || userError) {
          router.push('/');
          return;
        }

        setUser(userData);

        // Load profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Load posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);

      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Profile Not Found</h1>
          <p className="text-surface-500">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header Section */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <ProfileHeader profile={profile} isOwnProfile={true} />
        <div className="mt-6 border-t pt-6">
          <ProfileStats userId={profile.id} />
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Productivity Dashboard */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h2 className="text-xl font-bold text-surface-900 mb-4">Productivity</h2>
          <ProductivityDashboard userId={profile.id} />
        </div>

        {/* Goals List */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h2 className="text-xl font-bold text-surface-900 mb-4">Goals</h2>
          <GoalsList userId={profile.id} isOwnProfile={true} />
        </div>

        {/* Friends List */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h2 className="text-xl font-bold text-surface-900 mb-4">Friends</h2>
          <FriendsList userId={profile.id} />
        </div>
      </div>

      {/* Posts Grid */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-4">Posts</h2>
        <PostGrid posts={posts} />
      </div>

      <ComingSoonToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
