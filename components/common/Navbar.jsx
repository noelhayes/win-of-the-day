'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { Menu as MenuIcon } from 'lucide-react';
import { SearchBar } from '../../components';
import { usePathname } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getMobileMenuItems = () => {
    // Base items that are always available
    const items = [
      { href: '/feed', label: 'Feed' },
      { href: `/profile/${user?.id}`, label: 'Profile' },
      { onClick: handleSignOut, label: 'Sign Out' },
    ];

    // Filter out the current page from the menu
    return items.filter(item => {
      if (item.href) {
        // For profile pages, check if we're on any profile page
        if (item.href.startsWith('/profile') && pathname.startsWith('/profile')) {
          return false;
        }
        // For other pages, exact match
        return item.href !== pathname;
      }
      return true; // Keep non-link items (like Sign Out)
    });
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
          <Link href="/feed" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent hover:to-white transition-all duration-300">
              DW
            </span>
          </Link>

          {/* Search Bar - Now in the middle */}
          <div className="flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Mobile Menu - Only show on mobile/small screens */}
          <div className="block sm:hidden">
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
                <Menu.Items className="fixed right-4 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]">
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

          {/* Desktop Navigation - Show on larger screens */}
          <div className="hidden sm:flex items-center space-x-4">
            <Link
              href={`/profile/${user?.id}`}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
