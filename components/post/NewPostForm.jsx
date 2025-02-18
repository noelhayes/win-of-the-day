'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { Transition } from '@headlessui/react';
import { ComingSoonToast } from '../ui';

export default function NewPostForm({ onPostCreated, onUpdate }) {
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
            category_id: selectedCategory,
          }
        ])
        .select(`
          *,
          category:categories!posts_category_id_fkey (
            id,
            name,
            color,
            icon
          ),
          likes:likes(count)
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
      const postWithData = {
        ...newPost,
        profiles: profileData,
        likes_count: 0
      };
      
      setContent('');
      // Call both callbacks to ensure immediate UI update and proper data refresh
      if (onPostCreated) {
        onPostCreated(postWithData);
      }
      if (onUpdate) {
        onUpdate();
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

  return (
    <div className="sticky top-0 z-10 bg-gray-100 pt-4 pb-3">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="p-4">
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
                className="w-full min-h-[60px] max-h-[300px] p-4 pb-20 rounded-lg bg-gray-50 placeholder-gray-500 text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200 ease-in-out resize-none overflow-auto disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
              />
              
              {/* Action Bar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end space-x-3">
                {/* Categories - Fixed 2 rows */}
                <div className="flex-1">
                  {/* First Row */}
                  <div className="grid grid-cols-4 gap-1 mb-1">
                    {categories.slice(0, 4).map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center justify-center space-x-1 px-1.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
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
                        <span className="text-base leading-none">{category.icon}</span>
                        <span className="truncate">{category.name}</span>
                      </button>
                    ))}
                  </div>
                  {/* Second Row */}
                  <div className="grid grid-cols-4 gap-1">
                    {categories.slice(4, 8).map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center justify-center space-x-1 px-1.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
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
                        <span className="text-base leading-none">{category.icon}</span>
                        <span className="truncate">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-white whitespace-nowrap
                    transition-all duration-200 ease-in-out flex items-center space-x-2
                    ${isSubmitting || !content.trim() 
                      ? 'bg-gray-200 cursor-not-allowed' 
                      : 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow'
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
          </form>
        </div>
      </div>
    </div>
  );
}
