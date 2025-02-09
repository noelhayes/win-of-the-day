'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ProfileCard } from '../ui';

export default function FriendsList({ userId }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Load the users that the current user is following.
  useEffect(() => {
    if (userId) {
      loadFollowedUsers();
    }
  }, [userId]);

  const loadFollowedUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          following_id,
          following:profiles!follows_following_id_fkey(
            id, 
            name, 
            username,
            profile_image
          )
        `)
        .eq('follower_id', userId);
      if (error) throw error;

      // Map the follow records to get the followed user's profile.
      const followedUsers = data.map((follow) => ({
        ...follow.following,
        follow_id: follow.id,
      }));
      setFriends(followedUsers || []);
    } catch (error) {
      console.error('Error loading followed users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce the search input to reduce unnecessary queries.
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchUsers = async (query) => {
    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, profile_image')
        .ilike('name', `%${query}%`)
        .neq('id', userId)
        .limit(5);
      if (error) throw error;

      // Filter out users already followed.
      const followedIds = friends.map((user) => user.id);
      const filteredResults = data.filter((user) => !followedIds.includes(user.id));
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  // Inserts a new follow record into the "follows" table.
  const followUser = async (followId) => {
    try {
      const { error } = await supabase.from('follows').insert([
        {
          follower_id: userId,
          following_id: followId,
        },
      ]);
      if (error) throw error;

      // Optionally, refresh the list of followed users.
      loadFollowedUsers();

      // Clear search results and the query.
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error following user:', error);
      alert('Error following user. Please try again.');
    }
  };

  const viewProfile = (profileId) => {
    router.push(`/profile/${profileId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <h2 className="text-xl font-bold text-surface-900 mb-6">Friends</h2>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 bg-surface-50 border border-surface-200 rounded-lg placeholder-surface-400 focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
          />
          <svg
            className={`absolute left-3 top-3.5 w-4 h-4 ${
              searching ? 'text-primary-500 animate-spin' : 'text-surface-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {searching ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            )}
          </svg>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 bg-white border border-surface-200 rounded-lg shadow-lg divide-y">
            {searchResults.map((user) => (
              <ProfileCard
                key={user.id}
                profile={user}
                size="small"
                actionButton={
                  <button
                    onClick={() => followUser(user.id)}
                    className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Follow
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Followed Users List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <p className="text-surface-400 text-center py-8">
            No friends yet. Use the search bar to find friends!
          </p>
        ) : (
          friends.map((friend) => (
            <ProfileCard
              key={friend.follow_id}
              profile={friend}
              actionButton={
                <button
                  onClick={() => viewProfile(friend.id)}
                  className="px-4 py-2 text-surface-500 hover:text-primary-500 transition-colors duration-200"
                >
                  View Profile
                </button>
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
