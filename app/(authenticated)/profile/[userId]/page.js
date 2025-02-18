'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '../../../../utils/supabase/client';
import { 
  FollowButton, 
  ProfileStats, 
  PostGrid, 
  ProductivityDashboard,
  FriendsList,
  GoalsList,
  ProfileImageUpload
} from '../../../../components';
import { Edit3, MapPin, Link as LinkIcon, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [profileData, postsData, userData] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(),

          supabase
            .from('posts')
            .select(`
              *,
              categories (
                name,
                color
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),

          supabase.auth.getUser()
        ]);

        if (profileData.error) throw profileData.error;
        if (postsData.error) throw postsData.error;

        setProfile(profileData.data);
        setPosts(postsData.data || []);
        setCurrentUser(userData.data.user);

        // Check if current user is following this profile
        if (userData.data.user && userId !== userData.data.user.id) {
          // Get current user's profile ID
          const { data: currentProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', userData.data.user.id)
            .single();

          if (!profileError && currentProfile) {
            const { data: followData } = await supabase
              .from('follows')
              .select('*')
              .eq('follower_id', currentProfile.id)
              .eq('following_id', userId)
              .maybeSingle();
            
            setIsFollowing(!!followData);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      loadData();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
        <p className="mt-2 text-gray-600">The user profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Profile Header */}
          <div className="p-6 flex flex-col md:flex-row md:items-start md:space-x-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="relative h-32 w-32 md:h-40 md:w-40">
                {isOwnProfile ? (
                  <ProfileImageUpload
                    currentImage={profile.profile_image}
                    onUploadComplete={(url) => setProfile({ ...profile, profile_image: url })}
                    displayName={profile.username || profile.email?.split('@')[0] || 'U'}
                  />
                ) : profile.profile_image ? (
                  <Image
                    src={profile.profile_image}
                    alt={profile.username || 'Profile'}
                    fill
                    className="rounded-xl border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-indigo-100 rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-4xl font-bold text-indigo-600">
                      {(profile.username || profile.email?.split('@')[0] || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="mt-6 md:mt-0 flex-1">
              <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.username || profile.email?.split('@')[0]}
                  </h1>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
                <div className="flex space-x-3 mb-4 md:mb-0">
                  {isOwnProfile ? (
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  ) : (
                    <FollowButton targetUserId={userId} initialIsFollowing={isFollowing} />
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {profile.bio && (
                  <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-indigo-600"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      {new URL(profile.website).hostname}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="border-t border-gray-200">
            <div className="p-6">
              <ProfileStats userId={userId} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 gap-8">
          {/* Top Row: Productivity, Goals & Friends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Productivity Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Productivity</h2>
              <ProductivityDashboard userId={userId} />
            </div>

            {/* Goals Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Goals</h2>
              </div>
              <GoalsList
                userId={userId}
                isOwnProfile={isOwnProfile}
                isAdding={isAddingGoal}
                onAddingChange={setIsAddingGoal}
              />
            </div>

            {/* Friends Section */}
            <FriendsList userId={userId} />
          </div>

          {/* Bottom Row: Posts Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Posts</h2>
            <PostGrid posts={posts} />
          </div>
        </div>
      </div>
    </div>
  );
}
