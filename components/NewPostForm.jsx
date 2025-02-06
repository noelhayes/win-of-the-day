'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';

export default function NewPostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);
  const router = useRouter();
  const supabase = createClient();

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('You must be logged in to post');

      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            content,
            user_id: user.id,
          }
        ])
        .select(`
          *,
          profile:profiles(*)
        `)
        .single();

      if (postError) throw postError;
      
      setContent('');
      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-50 rounded-xl shadow-soft p-5 mb-6 border border-surface-200">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's your win of the day?"
          className="w-full min-h-[60px] max-h-[300px] p-4 pb-16 rounded-lg bg-white border border-surface-200 placeholder-surface-300 text-surface-800 focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-200 ease-in-out resize-none overflow-auto"
        />
        
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-surface-400 hover:text-primary-500 transition-colors duration-200"
            onClick={() => alert('Photo upload coming soon!')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={`
              px-4 py-1.5 rounded-lg font-medium text-white text-sm
              transition-all duration-200 ease-in-out
              ${isSubmitting || !content.trim() 
                ? 'bg-surface-200 cursor-not-allowed' 
                : 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sharing...</span>
              </div>
            ) : (
              'Share Win'
            )}
          </button>
        </div>
        
        {error && (
          <div className="absolute left-0 -bottom-6 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
    </form>
  );
}
