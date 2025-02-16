'use client';

import { useState } from 'react';
import ComingSoonToast from '../ui/ComingSoonToast';

export default function GoalsList({ userId, isOwnProfile }) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleInteraction = (action) => {
    setToastMessage(`Goals feature coming soon! (${action})`);
    setShowToast(true);
  };

  // Placeholder goals for UI demonstration
  const placeholderGoals = [
    {
      id: 1,
      title: 'Example Goal 1',
      description: 'This is a placeholder goal. Goals feature coming soon!',
      target_date: '2024-12-31',
      is_completed: false
    },
    {
      id: 2,
      title: 'Example Goal 2',
      description: 'Another placeholder goal showing the upcoming feature.',
      target_date: '2024-12-31',
      is_completed: true
    }
  ];

  return (
    <div className="space-y-6">
      {isOwnProfile && (
        <button
          onClick={() => handleInteraction('add')}
          className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:ring-2 focus:ring-primary-300"
        >
          Add Goal
        </button>
      )}
      
      {placeholderGoals.map(goal => (
        <div
          key={goal.id}
          className="p-4 bg-surface-50 rounded-lg space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">{goal.title}</h3>
              <p className="text-sm text-surface-600">{goal.description}</p>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => handleInteraction('toggle')}
                className={`p-2 rounded-full ${
                  goal.is_completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-surface-100 text-surface-600'
                }`}
              >
                {goal.is_completed ? '✓' : '○'}
              </button>
            )}
          </div>
          <div className="text-sm text-surface-500">
            Target: {new Date(goal.target_date).toLocaleDateString()}
          </div>
        </div>
      ))}
      
      <ComingSoonToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
