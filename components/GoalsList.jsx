'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

export default function GoalsList({ userId, isOwnProfile, isAdding, onAddingChange }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', target_date: '', is_shared: false });
  const supabase = createClient();

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          ...newGoal,
          user_id: userId,
        }])
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [...prev, data]);
      setNewGoal({ title: '', description: '', target_date: '', is_shared: false });
      onAddingChange(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Error creating goal. Please try again.');
    }
  };

  const toggleGoalCompletion = async (goalId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_completed: !currentStatus })
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev =>
        prev.map(goal =>
          goal.id === goalId
            ? { ...goal, is_completed: !goal.is_completed }
            : goal
        )
      );
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-surface-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Goal title"
                value={newGoal.title}
                onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-300"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Description"
                value={newGoal.description}
                onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-300 h-24"
              />
            </div>
            <div>
              <input
                type="date"
                value={newGoal.target_date}
                onChange={e => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                className="w-full p-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-300"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_shared"
                checked={newGoal.is_shared}
                onChange={e => setNewGoal(prev => ({ ...prev, is_shared: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="is_shared" className="text-sm text-surface-600">Share with friends</label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => onAddingChange(false)}
                className="px-4 py-2 text-surface-600 hover:text-surface-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
              >
                Save Goal
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center text-surface-500 py-4">
            No goals yet. Click "Add Goal" to get started!
          </div>
        ) : (
          goals.map(goal => (
            <div
              key={goal.id}
              className={`p-4 rounded-lg border ${
                goal.is_completed
                  ? 'bg-surface-50 border-surface-200'
                  : 'bg-white border-surface-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    goal.is_completed ? 'text-surface-500 line-through' : 'text-surface-900'
                  }`}>
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-sm text-surface-600 mt-1">{goal.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-surface-500">
                    <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
                    {goal.is_shared && <span>👥 Shared</span>}
                  </div>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => toggleGoalCompletion(goal.id, goal.is_completed)}
                    className={`ml-4 p-2 rounded-full transition-colors duration-200 ${
                      goal.is_completed
                        ? 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                        : 'bg-primary-50 text-primary-500 hover:bg-primary-100'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
