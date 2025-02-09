import { NextResponse } from 'next/server';
import { createClient } from './server';
import { middlewareLogger as logger } from '../logger';

export async function updateSession(request) {
  const requestUrl = new URL(request.url);
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_SITE_URL;

  logger.info('Processing request', { 
    url: request.url,
    pathname: requestUrl.pathname,
    method: request.method,
    baseUrl,
    env: process.env.NODE_ENV
  });

  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Create Supabase client with request cookies and response
    const supabase = await createClient(request.cookies, response);

    // Refresh the session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logger.error('Session refresh failed', error);
      return NextResponse.redirect(new URL('/?error=auth', baseUrl));
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
    return NextResponse.redirect(new URL('/?error=unknown', baseUrl));
  }
}
