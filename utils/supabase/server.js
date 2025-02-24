import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authLogger as logger } from '../logger';
import config from '../config';

export async function createClient(cookieStore = null, response = null) {
  if (!cookieStore) {
    cookieStore = cookies();
  }

  const siteUrl = config.baseUrl;

  logger.info('Creating Supabase server client', {
    env: process.env.VERCEL_ENV,
    siteUrl,
    vercelUrl: process.env.VERCEL_URL,
  });

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        site_url: siteUrl,
        pkce: { codeChallengeMethod: 'S256' },
      },
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

export async function updateProfile(userId, updates) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error updating profile:', error);
    return { data: null, error };
  }
}

export async function getProfile(userId) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error getting profile:', error);
    return { data: null, error };
  }
}
