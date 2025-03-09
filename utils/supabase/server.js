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
          // Only set cookies if we're in a Route Handler or Server Action context
          // This is indicated by the presence of a response object
          if (response) {
            // When in a Route Handler, we need to use the response object
            response.cookies.set({ name, value, ...options });
          } else if (cookieStore.set) {
            // Only set cookies directly when we're in a Server Action
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              logger.error('Error setting cookie', { error, name });
              // Don't throw the error as this would break the auth flow
              // Just log it and continue
            }
          } else {
            logger.warn('Cannot set cookie - not in a Route Handler or Server Action context', { name });
          }
        },
        remove(name, options) {
          if (response) {
            response.cookies.delete({ name, ...options });
          } else if (cookieStore.delete) {
            try {
              cookieStore.delete({ name, ...options });
            } catch (error) {
              logger.error('Error removing cookie', { error, name });
            }
          } else {
            logger.warn('Cannot remove cookie - not in a Route Handler or Server Action context', { name });
          }
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
