'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';
import { Loader2, Camera } from 'lucide-react';
import { Transition } from '@headlessui/react';
import ComingSoonToast from './ui/ComingSoonToast';

export default function NewPostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
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

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
      // Set default category to 'Other' if it exists
      const defaultCategory = data?.find(cat => cat.name === 'Other');
      if (defaultCategory) {
        setSelectedCategory(defaultCategory.id);
      }
    }

    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter your win of the day');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to post');
        return;
      }

      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            content: content.trim(),
            user_id: user.id,
            category_id: selectedCategory
          }
        ])
        .select(`
          id,
          content,
          is_private,
          created_at,
          updated_at,
          user_id,
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .single();

      if (postError) throw postError;

      // Get the profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, profile_image')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Combine the post and profile data
      const postWithProfile = {
        ...newPost,
        profile: profileData
      };
      
      setContent('');
      if (onPostCreated) {
        onPostCreated(postWithProfile);
      }
      router.refresh();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showComingSoon = () => {
    setShowToast(true);
  };

  // Split categories into two rows
  const midpoint = Math.ceil(categories.length / 2);
  const firstRow = categories.slice(0, midpoint);
  const secondRow = categories.slice(midpoint);

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-soft p-5 mb-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError('');
            }}
            placeholder="What's your win of the day?"
            disabled={isSubmitting}
            className="w-full min-h-[60px] max-h-[300px] p-4 pb-16 rounded-lg bg-white border border-gray-200 placeholder-gray-400 text-gray-900 focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-200 ease-in-out resize-none overflow-auto disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {/* Action Bar */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {/* Categories */}
            <div className="flex-1 mr-3">
              <div className="grid grid-cols-4 gap-1">
                {firstRow.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center justify-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'ring-2 ring-offset-1'
                        : 'hover:ring-2 hover:ring-offset-1 hover:ring-opacity-50'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id ? category.color : `${category.color}15`,
                      color: selectedCategory === category.id ? 'white' : category.color,
                      ringColor: category.color
                    }}
                  >
                    <span className="text-base">{category.icon}</span>
                    <span className="truncate">{category.name}</span>
                  </button>
                ))}
                {secondRow.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center justify-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'ring-2 ring-offset-1'
                        : 'hover:ring-2 hover:ring-offset-1 hover:ring-opacity-50'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id ? category.color : `${category.color}15`,
                      color: selectedCategory === category.id ? 'white' : category.color,
                      ringColor: category.color
                    }}
                  >
                    <span className="text-base">{category.icon}</span>
                    <span className="truncate">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-primary-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 rounded-lg"
                onClick={showComingSoon}
              >
                <Camera className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className={`
                  px-4 py-2 rounded-lg font-medium text-white
                  transition-all duration-200 ease-in-out flex items-center space-x-2
                  ${isSubmitting || !content.trim() 
                    ? 'bg-gray-200 cursor-not-allowed' 
                    : 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700'
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post Win</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
      <ComingSoonToast 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
        message="Image upload coming soon!"
      />
    </>
  );
}
