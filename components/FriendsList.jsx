'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

export default function FriendsList({ userId }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadFriends();
  }, [userId]);

  const loadFriends = async () => {
    try {
      // Get accepted friendships where the user is either the user_id or friend_id
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          friend:profiles!friendships_friend_id_fkey(id, name, email, profile_image),
          user:profiles!friendships_user_id_fkey(id, name, email, profile_image)
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Transform the data to get a list of friend profiles
      const friendsList = data.map(friendship => {
        const friend = friendship.user_id === userId ? friendship.friend : friendship.user;
        return { ...friend, friendship_id: friendship.id };
      });

      setFriends(friendsList || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, profile_image')
        .ilike('name', `%${query}%`)
        .neq('id', userId)
        .limit(5);

      if (error) throw error;

      // Filter out users who are already friends
      const friendIds = friends.map(friend => friend.id);
      const filteredResults = data.filter(user => !friendIds.includes(user.id));

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert([
          {
            user_id: userId,
            friend_id: friendId,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      // Clear search results and query
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Error sending friend request. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <h2 className="text-xl font-bold text-surface-900 mb-6">Friends</h2>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for friends..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
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
          <div className="mt-2 bg-white border border-surface-200 rounded-lg shadow-lg">
            {searchResults.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 hover:bg-surface-50 border-b last:border-b-0"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-medium text-white">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span>{user.name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-surface-900">{user.name}</p>
                    <p className="text-sm text-surface-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
          friends.map(friend => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-4 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors duration-200"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xl font-medium text-white">
                  {friend.profile_image ? (
                    <img
                      src={friend.profile_image}
                      alt={friend.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span>{friend.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="ml-4">
                  <p className="font-medium text-surface-900">{friend.name}</p>
                  <p className="text-sm text-surface-500">{friend.email}</p>
                </div>
              </div>
              <button
                onClick={() => {/* View friend's profile */}}
                className="px-4 py-2 text-surface-500 hover:text-primary-500 transition-colors duration-200"
              >
                View Profile
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
