'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import Link from 'next/link';
import { ProfileCard } from '../../../components';
import { Loader2 } from 'lucide-react';

export default function SearchResults() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    async function performSearch() {
      if (!searchQuery) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Search for users with partial username or name matches
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, name, profile_image')
          .or(`username.ilike.%${searchQuery}%, name.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;

        setResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {searchQuery ? `Search results for "${searchQuery}"` : 'Search Results'}
      </h1>

      {results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            {searchQuery
              ? `No users found matching "${searchQuery}"`
              : 'Enter a search term to find users'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {results.map((user) => (
            <Link key={user.id} href={`/profile/${user.id}`}>
              <ProfileCard
                profile={user}
                size="small"
                className="hover:bg-gray-50"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
