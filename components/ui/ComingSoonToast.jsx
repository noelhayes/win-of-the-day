'use client';

import { useState, useEffect } from 'react';

export default function ComingSoonToast({ message, isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <span className="text-yellow-400">✨</span>
        <span>{message || 'Coming soon!'}</span>
      </div>
    </div>
  );
}
