'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '../utils/supabase/client';
import { useEffect, useState } from 'react';
import SearchBar from './SearchBar';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 relative">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            <Link href="/feed" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent hover:to-white transition-all duration-300">
                WOTD
              </span>
            </Link>
          </div>

          {/* Center section - Search Bar */}
          <div className="flex-1 flex items-center justify-center px-8 max-w-2xl">
            <SearchBar />
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-1">
            <Link
              href="/feed"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/feed')
                  ? 'text-white bg-white/10'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Feed
            </Link>
            
            {user && (
              <Link
                href={`/profile/${user.id}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith('/profile')
                    ? 'text-white bg-white/10'
                    : 'text-indigo-100 hover:text-white hover:bg-white/10'
                }`}
              >
                Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
