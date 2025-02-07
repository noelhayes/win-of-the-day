'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';

export default function ProfileStats({ userId }) {
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    categories: [],
    streaks: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          postsCount,
          followersCount,
          followingCount,
          categoriesData,
          streaksData
        ] = await Promise.all([
          // Get total posts
          supabase
            .from('posts')
            .select('id', { count: 'exact' })
            .eq('user_id', userId),
          
          // Get followers count
          supabase
            .from('follows')
            .select('follower_id', { count: 'exact' })
            .eq('following_id', userId),
          
          // Get following count
          supabase
            .from('follows')
            .select('following_id', { count: 'exact' })
            .eq('follower_id', userId),
          
          // Get categories with post counts
          supabase
            .from('posts')
            .select(`
              category_id,
              categories (
                name,
                color
              )
            `)
            .eq('user_id', userId),

          // Get streaks data
          supabase
            .from('posts')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        ]);

        // Process categories data
        const categoryMap = new Map();
        categoriesData.data?.forEach(post => {
          if (post.category_id && post.categories) {
            const count = categoryMap.get(post.category_id)?.count || 0;
            categoryMap.set(post.category_id, {
              name: post.categories.name,
              color: post.categories.color,
              count: count + 1
            });
          }
        });

        // Calculate streaks
        const streaks = calculateStreaks(streaksData.data?.map(p => new Date(p.created_at)) || []);

        setStats({
          posts: postsCount.count || 0,
          followers: followersCount.count || 0,
          following: followingCount.count || 0
          // categories: Array.from(categoryMap.values()),
          // streaks
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  function calculateStreaks(dates) {
    if (!dates.length) return [];
    
    const streaks = [];
    let currentStreak = 1;
    let startDate = dates[0];
    
    for (let i = 1; i < dates.length; i++) {
      const dayDiff = Math.floor((dates[i-1] - dates[i]) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        streaks.push({
          length: currentStreak,
          startDate: dates[i],
          endDate: startDate
        });
        currentStreak = 1;
        startDate = dates[i];
      }
    }
    
    // Add the last streak
    streaks.push({
      length: currentStreak,
      startDate: dates[dates.length - 1],
      endDate: startDate
    });
    
    return streaks;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.posts}</div>
          <div className="text-sm text-gray-500">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.followers}</div>
          <div className="text-sm text-gray-500">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.following}</div>
          <div className="text-sm text-gray-500">Following</div>
        </div>
      </div>

      {/* {stats.streaks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-3">Streaks</h3>
          <div className="space-y-2">
            {stats.streaks.slice(0, 3).map((streak, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-500">🔥</span>
                  <span className="font-medium">{streak.length} days</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(streak.startDate).toLocaleDateString()} - {new Date(streak.endDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* {stats.categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-3">Categories</h3>
          <div className="space-y-2">
            {stats.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
                <span className="text-sm text-gray-500">{category.count} posts</span>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}
