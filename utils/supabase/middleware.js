import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { ensureProfile } from '../auth-helpers';
import { middlewareLogger as logger } from '../logger';

export async function updateSession(request) {
  const requestUrl = new URL(request.url);
  logger.info('Processing request', { 
    url: request.url,
    pathname: requestUrl.pathname,
    method: request.method
  });

  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Log available cookies
    const availableCookies = request.cookies.getAll();
    logger.debug('Available cookies', { 
      cookies: availableCookies.map(c => ({ 
        name: c.name, 
        options: { path: c.path, domain: c.domain } 
      }))
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            const cookie = request.cookies.get(name)?.value;
            logger.cookieOperation('get', name, { value: cookie ? 'present' : 'missing' });
            return cookie;
          },
          set(name, value, options) {
            try {
              // If in production, ensure cookie is secure
              if (process.env.NODE_ENV === 'production') {
                options = { ...options, secure: true };
              }
              
              const cookieOptions = {
                ...options,
                // Ensure cookies work across all paths
                path: '/',
              };

              logger.cookieOperation('set', name, cookieOptions);
              
              response.cookies.set({
                name,
                value,
                ...cookieOptions,
              });
            } catch (error) {
              logger.error('Failed to set cookie', error, { cookieName: name });
            }
          },
          remove(name, options) {
            try {
              const cookieOptions = {
                ...options,
                // Ensure cookies are removed from all paths
                path: '/',
              };

              logger.cookieOperation('remove', name, cookieOptions);
              
              response.cookies.delete({
                name,
                ...cookieOptions,
              });
            } catch (error) {
              logger.error('Failed to remove cookie', error, { cookieName: name });
            }
          },
        },
      }
    );

    // Get current session
    logger.debug('Fetching session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logger.error('Failed to get session', sessionError);
      return response;
    }

    if (session) {
      logger.info('Session found', { 
        userId: session.user.id,
        expiresAt: session.expires_at
      });

      // Refresh the session
      logger.debug('Refreshing session');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        logger.error('Failed to refresh session', refreshError);
        return response;
      }
      logger.info('Session refreshed successfully');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        logger.error('Failed to get user', userError);
        return response;
      }

      if (user) {
        logger.info('User found', {
          id: user.id,
          email: user.email,
          lastSignInAt: user.last_sign_in_at
        });

        try {
          // Check if profile exists
          logger.debug('Checking profile existence');
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            logger.info('Profile not found, creating new profile');
            await ensureProfile(user);
          } else if (profileError) {
            logger.error('Failed to check profile', profileError);
          } else {
            logger.info('Profile exists', { profileId: existingProfile.id });
          }
        } catch (error) {
          logger.error('Profile operation failed', error);
        }
      }
    } else {
      logger.info('No session found', { 
        path: requestUrl.pathname,
        headers: Object.fromEntries(request.headers)
      });
    }

    // Set the pathname header for the layout component
    response.headers.set('x-pathname', requestUrl.pathname);
    logger.debug('Set pathname header', { pathname: requestUrl.pathname });

    return response;
  } catch (error) {
    logger.error('Middleware execution failed', error, {
      url: request.url,
      method: request.method
    });
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}
