'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!content.trim()) return;
    
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      if (res.status === 401) {
        // Redirect to sign in if not authenticated
        router.push('/sign-in');
        return;
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }
      
      setContent('');
      onPostCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's your win of the day?"
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      <button 
        type="submit" 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Post Win
      </button>
    </form>
  );
}
