import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { middlewareLogger as logger } from '../logger';
import { getSiteUrl } from '../config';

/**
 * Creates a Supabase client for server-side usage
 */
export async function createClient(cookieStore = null, response = null) {
  // If no cookieStore provided, use the default from next/headers
  if (!cookieStore) {
    cookieStore = cookies();
  }

  const siteUrl = getSiteUrl();

  logger.info('Creating Supabase server client', {
    env: process.env.NODE_ENV,
    siteUrl,
    vercelUrl: process.env.VERCEL_URL
  });

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: false, // We handle this manually in the callback
        persistSession: true,
        site_url: siteUrl,
        pkce: {
          codeChallengeMethod: 'S256'
        }
      },
      cookies: {
        get(name) {
          const cookie = cookieStore.get(name)?.value;
          logger.cookieOperation('get', name, { value: cookie ? 'present' : 'missing' });
          return cookie;
        },
        set(name, value, options) {
          try {
            const cookieOptions = {
              ...options,
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            };

            logger.cookieOperation('set', name, cookieOptions);

            // If response is provided (middleware case), use response.cookies
            if (response) {
              response.cookies.set(name, value, cookieOptions);
            } else {
              // Otherwise use the cookieStore
              cookieStore.set(name, value, cookieOptions);
            }
          } catch (error) {
            logger.error('Error setting cookie', { name, error });
          }
        },
        remove(name, options) {
          try {
            const cookieOptions = {
              ...options,
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              maxAge: -1
            };

            logger.cookieOperation('remove', name, cookieOptions);

            if (response) {
              response.cookies.set(name, '', cookieOptions);
            } else {
              cookieStore.set(name, '', cookieOptions);
            }
          } catch (error) {
            logger.error('Error removing cookie', { name, error });
          }
        }
      }
    }
  );
}

/**
 * Helper function to update a user's profile (server-side)
 */
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

/**
 * Helper function to get a user's profile (server-side)
 */
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
