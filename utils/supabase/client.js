/**
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').Session} Session
 */

import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance = null;

/**
 * Creates a Supabase client for browser usage with session handling
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  // Force localhost in development, regardless of NEXT_PUBLIC_SITE_URL
  const siteUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : (process.env.NEXT_PUBLIC_SITE_URL || window?.location?.origin);

  console.log('Creating Supabase browser client with config:', {
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    siteUrl,
    redirectTo: `${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : siteUrl}/api/auth/callback`
  });

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Force localhost in development for auth callback
        redirectTo: `${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : siteUrl}/api/auth/callback`,
        // Add site URL to auth request to maintain development context
        site_url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : siteUrl
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  );

  // Set up auth state change listener
  supabaseInstance.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', {
      event,
      userId: session?.user?.id,
      env: process.env.NODE_ENV,
      isDev: process.env.NODE_ENV === 'development'
    });
  });

  return supabaseInstance;
}

/**
 * Gets the current session if it exists
 * @returns {Promise<Session|null>}
 */
export async function getCurrentSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
}

/**
 * Gets the current user if authenticated
 * @returns {Promise<User|null>}
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}
