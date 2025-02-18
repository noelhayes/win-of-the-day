'use client';

import Link from 'next/link';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState, Fragment } from 'react';
import { SearchBar } from '../../components';
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
    <nav className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 relative z-10">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            <Link href="/feed" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent hover:to-white transition-all duration-300">
                DW
              </span>
            </Link>
          </div>

          {/* Center section - Search Bar (hidden on mobile) */}
          <div className="hidden md:flex flex-1 items-center justify-center px-8 max-w-2xl">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/feed">Feed</NavLink>
            {user && (
              <>
                <NavLink href={`/profile/${user.id}`}>Profile</NavLink>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-indigo-100 hover:text-white hover:bg-white/10"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          {user && getMobileMenuItems().length > 0 && (
            <div className="flex items-center md:hidden">
              <Menu as="div" className="relative inline-block text-left">
                {({ open }) => (
                  <>
                    <Menu.Button className="p-2 rounded-lg text-indigo-100 hover:text-white hover:bg-white/10 focus:outline-none">
                      <MenuIcon className="h-6 w-6" />
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
                      <Menu.Items className="fixed right-4 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="py-1">
                          {getMobileMenuItems().map((item, index) => (
                            <Menu.Item key={index}>
                              {({ active }) => (
                                item.href ? (
                                  <Link
                                    href={item.href}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } block px-4 py-2 text-sm`}
                                  >
                                    {item.label}
                                  </Link>
                                ) : (
                                  <button
                                    onClick={item.onClick}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } block w-full text-left px-4 py-2 text-sm`}
                                  >
                                    {item.label}
                                  </button>
                                )
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar (shown below navbar) */}
      <div className="md:hidden border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}
