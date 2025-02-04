'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';

export default function NewPostForm() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!content.trim()) return;
    
    try {
      setIsSubmitting(true);
      console.log('Creating new post...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User error:', userError);
        router.push('/');
        return;
      }

      console.log('Current user:', user);

      const { error: postError, data: newPost } = await supabase
        .from('posts')
        .insert([{ 
          content: content.trim(),
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      console.log('Post creation result:', { newPost, postError });

      if (postError) throw postError;
      
      setContent('');
      router.refresh();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Share your win of the day
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's your win of the day?"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          isSubmitting || !content.trim()
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {isSubmitting ? 'Posting...' : 'Share Win'}
      </button>
    </form>
  );
}
