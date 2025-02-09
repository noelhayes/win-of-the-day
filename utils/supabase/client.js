/**
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').Session} Session
 */

import { createBrowserClient } from '@supabase/ssr'
import { getSiteUrl } from '../site-url';

let supabaseInstance = null;

/**
 * Creates a Supabase client for browser usage with session handling
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  // Since this is client-side code, we can safely use window.location.origin as fallback
  const siteUrl = getSiteUrl();

  console.log('Creating Supabase browser client with config:', {
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    siteUrl,
    origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    redirectTo: `${siteUrl}/api/auth/callback`
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
        redirectTo: `${siteUrl}/api/auth/callback`,
        site_url: siteUrl
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
      siteUrl,
      origin: window.location.origin
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
