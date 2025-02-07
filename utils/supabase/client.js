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

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
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
    console.log('Auth state changed:', event, session?.user?.id);
    
    if (event === 'SIGNED_IN') {
      // Trigger profile check/creation
      fetch('/api/auth/ensure-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id })
      }).catch(console.error);
    }
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
    console.error('Error getting session:', error);
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
