'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

export default function ProductivityDashboard({ userId }) {
  const [stats, setStats] = useState({
    totalWins: 0,
    currentStreak: 0,
    longestStreak: 0,
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      // Get total wins and their categories
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          created_at,
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate total wins
      const totalWins = posts?.length || 0;

      // Calculate streaks
      const streaks = calculateStreaks(posts?.map(p => new Date(p.created_at)) || []);

      // Process category stats
      const categoryStats = processCategoryStats(posts || []);

      setStats({
        totalWins,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        categories: categoryStats
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreaks = (dates) => {
    if (!dates.length) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let currentStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if the most recent post was today or yesterday
    const mostRecent = new Date(dates[0]);
    mostRecent.setHours(0, 0, 0, 0);

    if (mostRecent.getTime() === today.getTime() || mostRecent.getTime() === yesterday.getTime()) {
      current = 1;
      currentStreak = 1;

      for (let i = 1; i < dates.length; i++) {
        const date = new Date(dates[i]);
        const prevDate = new Date(dates[i - 1]);
        
        const diffDays = Math.floor((prevDate - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let tempStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const date = new Date(dates[i]);
      const prevDate = new Date(dates[i - 1]);
      
      const diffDays = Math.floor((prevDate - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return {
      current: currentStreak,
      longest: Math.max(longest, currentStreak)
    };
  };

  const processCategoryStats = (posts) => {
    const categoryMap = new Map();

    posts.forEach(post => {
      if (post.categories) {
        const category = post.categories;
        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, {
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon,
            count: 1
          });
        } else {
          categoryMap.get(category.id).count++;
        }
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Progress Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Wins */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-medium opacity-90">Total Wins</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalWins}</p>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-medium opacity-90">Current Streak</h3>
          <p className="text-3xl font-bold mt-2">{stats.currentStreak} days</p>
        </div>

        {/* Longest Streak */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-medium opacity-90">Longest Streak</h3>
          <p className="text-3xl font-bold mt-2">{stats.longestStreak} days</p>
        </div>
      </div>

      {/* Category Stats */}
      {stats.categories.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Wins by Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.categories.map(category => (
              <div 
                key={category.id}
                className="flex items-center p-4 rounded-lg"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <span className="text-2xl mr-3">{category.icon}</span>
                <div>
                  <h4 className="font-medium" style={{ color: category.color }}>{category.name}</h4>
                  <p className="text-sm text-gray-600">{category.count} wins</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
