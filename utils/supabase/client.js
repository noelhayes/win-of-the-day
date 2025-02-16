'use client';

import { createBrowserClient } from '@supabase/ssr';

let supabaseInstance = null;

const getSiteUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return window.location.origin;
};

/**
 * Creates a Supabase client for browser usage with session handling
 */
export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const siteUrl = getSiteUrl();

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
      siteUrl
    });
  });

  return supabaseInstance;
}

/**
 * Gets the current session if it exists
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
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

/**
 * Helper function to update a user's profile (client-side)
 */
export async function updateProfile(userId, updates) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}

/**
 * Helper function to get a user's profile (client-side)
 */
export async function getProfile(userId) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting profile:', error);
    return { data: null, error };
  }
}
