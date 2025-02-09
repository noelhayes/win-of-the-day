'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function EditPostForm({ post, onSave, onCancel }) {
  const [content, setContent] = useState(post.content);
  const [isPrivate, setIsPrivate] = useState(post.is_private);
  const [category, setCategory] = useState(post.category?.id);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('posts')
        .update({
          content: content.trim(),
          is_private: isPrivate,
          category_id: category,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .select('*, categories(*)')
        .single();

      if (error) throw error;

      // Get the user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', post.user_id)
        .single();

      // Combine the post with the profile data
      const updatedPost = {
        ...data,
        profiles: profileData
      };

      onSave(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's your win of the day?"
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      <div className="flex items-center space-x-4">
        {/* Category dropdown */}
        <select
          value={category || ''}
          onChange={(e) => setCategory(e.target.value || null)}
          disabled={isLoading}
          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        {/* Privacy toggle */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={isLoading}
              className="sr-only"
            />
            <div className="w-10 h-5 rounded-full transition-colors duration-200 ease-in-out flex items-center px-0.5" 
              style={{ 
                backgroundColor: isPrivate ? 'rgb(37, 99, 235)' : 'rgb(229, 231, 235)'
              }}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                isPrivate ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>
          <span className="text-sm text-gray-600">Private</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  );
}
