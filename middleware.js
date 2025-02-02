import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/feed', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // Auth-only routes that should redirect to feed if authenticated
  const authOnlyRoutes = ['/sign-in', '/sign-up'];
  const isAuthOnlyRoute = authOnlyRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // If accessing a protected route without session, redirect to home
  if (!session && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing auth-only routes with session, redirect to feed
  if (session && isAuthOnlyRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/feed';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Specify which routes this middleware should run for
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
}
