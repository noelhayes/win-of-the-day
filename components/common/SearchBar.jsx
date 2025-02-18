'use client';

import { useState } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // Redirect to search results page with the search term
      const encodedSearchTerm = encodeURIComponent(searchTerm.trim());
      router.push(`/search?q=${encodedSearchTerm}`);
      setSearchTerm('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Find Friends by name or username!"
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent placeholder-indigo-200/70 text-white text-sm transition-all duration-200"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-indigo-200/70" />
        </div>
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="h-4 w-4 border-2 border-indigo-200/70 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </form>
  );
}
