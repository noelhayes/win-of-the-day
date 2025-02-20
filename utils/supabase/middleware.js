import { NextResponse } from 'next/server';
import { createClient } from './server';
import { middlewareLogger as logger } from '../logger';

// Cache session refresh timestamps to prevent too frequent refreshes
const SESSION_REFRESH_CACHE = new Map();
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export async function updateSession(request) {
  const requestUrl = new URL(request.url);
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_SITE_URL;

  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Create Supabase client
    const supabase = await createClient(request.cookies, response);

    // Check if we need to refresh the session
    const sessionKey = request.cookies.get('sb-ymwdctbvtmejqmialxrg-auth-token')?.value;
    const lastRefresh = SESSION_REFRESH_CACHE.get(sessionKey);
    const now = Date.now();

    let session = null;
    
    if (!lastRefresh || (now - lastRefresh) > SESSION_REFRESH_INTERVAL) {
      // Only refresh if enough time has passed
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Session refresh failed', error);
        // Only redirect on auth routes if there's an error
        if (requestUrl.pathname.startsWith('/(authenticated)') || 
            requestUrl.pathname.startsWith('/api/protected')) {
          return NextResponse.redirect(new URL('/', baseUrl));
        }
        // For other routes, just continue without a session
        return response;
      }
      
      session = newSession;
      if (sessionKey) {
        SESSION_REFRESH_CACHE.set(sessionKey, now);
      }
    }

    // Handle protected routes
    const isAuthRoute = requestUrl.pathname.startsWith('/(authenticated)') || 
                       requestUrl.pathname.startsWith('/api/protected');
    const isAuthCallback = requestUrl.pathname === '/api/auth/callback';

    if (isAuthRoute && !session) {
      logger.info('Redirecting unauthenticated user from protected route', {
        pathname: requestUrl.pathname
      });
      return NextResponse.redirect(new URL('/', baseUrl));
    }

    return response;
  } catch (e) {
    logger.error('Middleware error', e);
    return NextResponse.next();
  }
}
