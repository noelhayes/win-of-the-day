'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../utils/supabase/client';
import ProfileHeader from '../../../components/ProfileHeader';
import GoalsList from '../../../components/GoalsList';
import FriendsList from '../../../components/FriendsList';
import ProductivityDashboard from '../../../components/ProductivityDashboard';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
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

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column - Profile & Friends */}
        <div className="xl:col-span-1">
          <div className="space-y-6">
            <ProfileHeader profile={profile} isOwnProfile={true} />
            <FriendsList userId={profile.id} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="xl:col-span-3 space-y-6">
          {/* Progress Dashboard */}
          <ProductivityDashboard userId={profile.id} />

          {/* Goals and Habits Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Target Wins of the Year */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-surface-900">Target Wins of the Year</h2>
                <button 
                  onClick={() => setIsAddingGoal(true)}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Add Goal
                </button>
              </div>
              <GoalsList 
                userId={profile.id} 
                isOwnProfile={true} 
                isAdding={isAddingGoal}
                onAddingChange={setIsAddingGoal}
              />
            </div>

            {/* Daily Habits */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-surface-900">Daily Habits</h2>
                <button 
                  onClick={() => {/* Add new habit */}}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Add Habit
                </button>
              </div>
              <div className="text-surface-500 text-center py-8">
                Coming soon: Track your daily habits and build consistency!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
