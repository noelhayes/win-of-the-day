'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

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
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Find friends by name or username!"
          className="w-full h-10 pl-10 pr-4 text-sm bg-white/10 border border-white/20 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="h-4 w-4 border-2 border-white/20 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </form>
  );
}
