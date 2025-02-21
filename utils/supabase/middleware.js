import { NextResponse } from 'next/server';
import { createClient } from './server';
import { middlewareLogger as logger } from '../logger';

const SESSION_REFRESH_CACHE = new Map();
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export async function updateSession(request) {
  const requestUrl = new URL(request.url);
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://dailywin.app');

  try {
    let response = NextResponse.next({ request: { headers: request.headers } });
    const supabase = await createClient(request.cookies, response);

    const sessionCookie = request.cookies.get(
      'sb-ymwdctbvtmejqmialxrg-auth-token'
    )?.value;
    const lastRefresh = SESSION_REFRESH_CACHE.get(sessionCookie);
    const now = Date.now();

    let session = null;
    if (!lastRefresh || now - lastRefresh > SESSION_REFRESH_INTERVAL) {
      const { data: { session: newSession }, error } =
        await supabase.auth.getSession();
      if (error) {
        logger.error('Session refresh failed', error);
        if (
          requestUrl.pathname.startsWith('/(authenticated)') ||
          requestUrl.pathname.startsWith('/api/protected')
        ) {
          return NextResponse.redirect(new URL('/', baseUrl));
        }
        return response;
      }
      session = newSession;
      if (sessionCookie) {
        SESSION_REFRESH_CACHE.set(sessionCookie, now);
      }
    }

    const isAuthRoute =
      requestUrl.pathname.startsWith('/(authenticated)') ||
      requestUrl.pathname.startsWith('/api/protected');
    if (isAuthRoute && !session) {
      logger.info('Redirecting unauthenticated user from protected route', {
        pathname: requestUrl.pathname,
      });
      return NextResponse.redirect(new URL('/', baseUrl));
    }

    // Add security headers to response
    const securityHeaders = {
      'X-DNS-Prefetch-Control': 'on',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      'X-XSS-Protection': '1; mode=block',
    };
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('x-pathname', requestUrl.pathname);

    return response;
  } catch (e) {
    logger.error('Middleware error', e);
    return NextResponse.next();
  }
}
