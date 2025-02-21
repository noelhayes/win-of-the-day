'use client';

import Link from 'next/link';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState, Fragment } from 'react';
import { SearchBar } from '../../components';
import NotificationBell from '../notifications/NotificationBell';
import { Menu, Transition } from '@headlessui/react';
import { Menu as MenuIcon, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const isActive = (path) => pathname === path;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      setUser(null);
      router.push('/');
    }
  };

  const NavLink = ({ href, children, className = '' }) => (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        (isActive(href) || (href.startsWith('/profile') && pathname.startsWith('/profile')))
          ? 'text-white bg-white/10'
          : 'text-indigo-100 hover:text-white hover:bg-white/10'
      } ${className}`}
    >
      {children}
    </Link>
  );

  // Get mobile menu items based on current route
  const getMobileMenuItems = () => {
    if (!user) return [];

    const items = [];
    
    // Always show non-active routes
    if (!isActive('/feed')) {
      items.push({
        label: 'Feed',
        href: '/feed'
      });
    }
    
    if (!pathname.startsWith('/profile')) {
      items.push({
        label: 'Profile',
        href: `/profile/${user.id}`
      });
    }

    // Always show sign out
    items.push({
      label: 'Sign Out',
      onClick: handleSignOut
    });

    return items;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 z-50">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent"></div>

      {/* Main navbar content */}
      <div className="relative px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent hover:to-white transition-all duration-300">
              DW
            </span>
          </Link>

          {/* Search Bar - Now in the middle */}
          <div className="flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-1">
            <NotificationBell />
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
              <>
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
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-indigo-100 hover:text-white hover:bg-white/10"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
          {/* Mobile Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 rounded-lg text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20">
              <MenuIcon className="w-6 h-6" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="fixed right-4 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
                <div className="py-1">
                  {getMobileMenuItems().map((item, index) => (
                    <Menu.Item key={index}>
                      {({ active }) => (
                        item.href ? (
                          <Link
                            href={item.href}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 space-x-2`}
                          >
                            <span>{item.label}</span>
                          </Link>
                        ) : (
                          <button
                            onClick={item.onClick}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full text-left px-4 py-2 text-sm text-gray-700`}
                          >
                            <span>{item.label}</span>
                          </button>
                        )
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  );
}
