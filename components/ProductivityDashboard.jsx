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
      // Get total wins
      const { count: totalWins } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get wins by category
      const { data: categorizedWins } = await supabase
        .from('post_categories')
        .select(`
          category_id,
          win_categories (
            name,
            color,
            icon
          )
        `)
        .eq('posts.user_id', userId);

      // Calculate streaks
      const { data: posts } = await supabase
        .from('posts')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const streaks = calculateStreaks(posts?.map(p => new Date(p.created_at)) || []);

      setStats({
        totalWins: totalWins || 0,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        categories: processCategoryStats(categorizedWins || [])
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

  const processCategoryStats = (categorizedWins) => {
    const categoryMap = new Map();

    categorizedWins.forEach(win => {
      const category = win.win_categories;
      if (!category) return;

      if (!categoryMap.has(category.name)) {
        categoryMap.set(category.name, {
          name: category.name,
          color: category.color,
          icon: category.icon,
          count: 0
        });
      }

      categoryMap.get(category.name).count++;
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Only show top 4 categories
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <h2 className="text-xl font-bold text-surface-900 mb-6">Your Progress</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-50 rounded-lg p-4">
          <div className="text-surface-500 text-sm mb-1">Total Wins</div>
          <div className="text-2xl font-bold text-surface-900">{stats.totalWins}</div>
        </div>

        <div className="bg-surface-50 rounded-lg p-4">
          <div className="text-surface-500 text-sm mb-1">Current Streak</div>
          <div className="text-2xl font-bold text-surface-900">
            {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>

        <div className="bg-surface-50 rounded-lg p-4">
          <div className="text-surface-500 text-sm mb-1">Longest Streak</div>
          <div className="text-2xl font-bold text-surface-900">
            {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {stats.categories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Top Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.categories.map(category => (
              <div
                key={category.name}
                className="flex flex-col items-center p-3 rounded-lg"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: category.color }}
                >
                  <span className="text-white text-sm">
                    {category.icon}
                  </span>
                </div>
                <div className="text-sm font-medium text-surface-900">{category.name}</div>
                <div className="text-sm text-surface-500">{category.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
