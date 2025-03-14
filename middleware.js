import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

export async function middleware(req) {
  // Create base response
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  try {
    // Create Supabase client with standardized cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: () => null,
          getAll: () => {
            const cookies = {};
            for (const cookie of req.cookies.getAll()) {
              cookies[cookie.name] = cookie.value;
            }
            return cookies;
          },
          set: () => null,
          setAll: (cookiesList) => {
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });

            for (const cookie of cookiesList) {
              response.cookies.set({
                ...cookie,
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 // 7 days
              });
            }

            return response;
          },
          remove: () => null,
          removeAll: () => null
        },
      }
    );

    // Handle auth state and session refresh
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Auth error in middleware:', sessionError.message);
      return response;
    }

    // Handle auth callback
    const requestUrl = new URL(req.url);
    const isAuthCallback = requestUrl.pathname === '/auth/callback';
    const hasCode = requestUrl.searchParams.has('code');
    const hasError = requestUrl.searchParams.has('error');

    // Log request info for debugging
    console.log('Middleware request:', {
      pathname: requestUrl.pathname,
      origin: requestUrl.origin,
      isAuthCallback,
      hasCode,
      hasError,
      env: process.env.NODE_ENV
    });

    if (isAuthCallback) {
      if (hasError) {
        return NextResponse.redirect(new URL('/?error=auth', requestUrl.origin));
      }

      if (hasCode) {
        // Let auth callback route handle the code exchange
        return response;
      }
    }

    // Add auth state to response headers for server components
    if (session?.user?.id) {
      response.headers.set('x-auth-state', 'authenticated');
      response.headers.set('x-user-id', session.user.id);
    } else {
      response.headers.delete('x-auth-state');
      response.headers.delete('x-user-id');
    }

    // Handle auth redirects
    const isAuthPage = requestUrl.pathname === '/';
    const isPublicPath = requestUrl.pathname.startsWith('/_next') || 
                        requestUrl.pathname.startsWith('/public') ||
                        requestUrl.pathname === '/favicon.ico' ||
                        requestUrl.pathname === '/auth/callback';
    
    if (session?.user) {
      // If logged in and trying to access auth page, redirect to feed
      if (isAuthPage) {
        const redirectResponse = NextResponse.redirect(new URL('/feed', requestUrl.origin));
        
        // Copy cookies to redirect response
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set({
            name: cookie.name,
            value: cookie.value,
            ...cookie,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 // 7 days
          });
        });

        return redirectResponse;
      }
    } else {
      // If not logged in and trying to access protected pages, redirect to auth
      if (!isAuthPage && !isPublicPath) {
        const redirectResponse = NextResponse.redirect(new URL('/', requestUrl.origin));
        
        // Copy cookies to redirect response
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set({
            name: cookie.name,
            value: cookie.value,
            ...cookie,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 // 7 days
          });
        });

        return redirectResponse;
      }
    }

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Middleware error:', error.message);
    
    // Ensure security headers are set even on error
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
