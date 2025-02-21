'use client';

import { createBrowserClient } from '@supabase/ssr';
import config from '../config';

let supabaseInstance = null;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const siteUrl = config.baseUrl;

  console.log('Creating Supabase browser client', {
    env: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    siteUrl,
    origin: typeof window !== 'undefined' ? window.location.origin : null,
  });

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        pkce: { codeChallengeMethod: 'S256' },
        // Use our determined site URL for the redirect
        redirectTo: `${siteUrl}/api/auth/callback`,
        site_url: siteUrl,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    }
  );

  supabaseInstance.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', {
      event,
      userId: session?.user?.id,
      email: session?.user?.email,
      env: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });
  });

  return supabaseInstance;
}
