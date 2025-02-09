import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { middlewareLogger as logger } from '../logger';
import { getSiteUrl } from '../site-url';

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
        detectSessionInUrl: true,
        persistSession: true,
        site_url: siteUrl
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
            };

            logger.cookieOperation('set', name, cookieOptions);

            // If response is provided (middleware case), use response.cookies
            if (response) {
              response.cookies.set({
                name,
                value,
                ...cookieOptions,
              });
            } else {
              // Server component case
              cookieStore.set({ name, value, ...cookieOptions });
            }
          } catch (error) {
            logger.error('Failed to set cookie', error, { cookieName: name });
          }
        },
        remove(name, options) {
          try {
            const cookieOptions = {
              ...options,
              path: '/',
            };

            logger.cookieOperation('remove', name, cookieOptions);

            // If response is provided (middleware case), use response.cookies
            if (response) {
              response.cookies.set({
                name,
                value: '',
                ...cookieOptions,
                expires: new Date(0),
              });
            } else {
              // Server component case
              cookieStore.delete({ name, ...cookieOptions });
            }
          } catch (error) {
            logger.error('Failed to remove cookie', error, { cookieName: name });
          }
        },
      },
    }
  );
}
