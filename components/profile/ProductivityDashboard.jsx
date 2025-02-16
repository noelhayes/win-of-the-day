'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Trophy, Target } from 'lucide-react';

export default function ProductivityDashboard({ userId }) {
  const [stats, setStats] = useState({
    totalWins: 0,
    completedGoals: 0,
    inProgressGoals: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Get total wins
      const { data: winsData, error: winsError } = await supabase
        .from('posts')
        .select('count', { count: 'exact' })
        .eq('user_id', userId);

      if (winsError) throw winsError;

      setStats({
        totalWins: winsData[0]?.count || 0,
        completedGoals: 0, // Placeholder for future implementation
        inProgressGoals: 0 // Placeholder for future implementation
      });
    } catch (error) {
      console.error('Error loading productivity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Wins',
      value: stats.totalWins,
      icon: Trophy,
      color: 'text-yellow-500'
    },
    {
      label: 'Completed Goals',
      value: stats.completedGoals,
      icon: Target,
      color: 'text-green-500'
    },
    {
      label: 'In Progress',
      value: stats.inProgressGoals,
      icon: Target,
      color: 'text-blue-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className="flex items-center p-4 bg-gray-50 rounded-lg"
        >
          <div className={`p-3 rounded-lg ${item.color} bg-opacity-10 mr-4`}>
            <item.icon className={`w-6 h-6 ${item.color}`} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">{item.label}</div>
            <div className="text-lg font-semibold text-gray-900">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
