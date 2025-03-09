import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Security headers to add to all responses
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-XSS-Protection': '1; mode=block'
};

// Use a token bucket algorithm for rate limiting
class TokenBucket {
  static buckets = new Map();
  static cleanup() {
    const now = Date.now();
    for (const [key, bucket] of TokenBucket.buckets) {
      if (now - bucket.lastRefill > 60000) { // Remove buckets older than 1 minute
        TokenBucket.buckets.delete(key);
      }
    }
  }

  constructor(key, capacity = 50, refillRate = 10) { // 50 requests per minute, refill 10 every second
    this.key = key;
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
    TokenBucket.buckets.set(key, this);
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const refillAmount = (timePassed / 1000) * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + refillAmount);
    this.lastRefill = now;
  }

  tryConsume() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

// Clean up old buckets periodically
if (typeof window === 'undefined') {
  // Only run this on the server side
  setInterval(() => TokenBucket.cleanup(), 60000);
}

/**
 * Next.js middleware function that runs before each request
 * Handles authentication, rate limiting, and security headers
 */
export async function middleware(req) {
  // Skip middleware for static assets and API routes that don't need auth
  const { pathname } = req.nextUrl;
  
  // Get client IP
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  // Check rate limit
  const bucket = TokenBucket.buckets.get(ip) || new TokenBucket(ip);
  if (!bucket.tryConsume()) {
    console.warn(`Rate limit exceeded for IP: ${ip}, path: ${pathname}`);
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          ...securityHeaders
        }
      }
    );
  }

  // Create an empty response to start
  const response = NextResponse.next();

  try {
    // Create Supabase client with response for cookie management
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (name) => {
            return req.cookies.get(name)?.value;
          },
          set: (name, value, options) => {
            // In middleware, we must use the response object to set cookies
            try {
              response.cookies.set({
                name,
                value,
                ...options,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
              });
            } catch (error) {
              console.error('Error setting cookie in middleware:', error, { name });
            }
          },
          remove: (name, options) => {
            // In middleware, we must use the response object to remove cookies
            try {
              response.cookies.set({
                name,
                value: '',
                ...options,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 0,
              });
            } catch (error) {
              console.error('Error removing cookie in middleware:', error, { name });
            }
          },
        },
      }
    );

    try {
      // Refresh session if needed
      await supabase.auth.getSession();
    } catch (error) {
      console.error('Error refreshing session in middleware:', error, { path: pathname });
      // Continue with the request even if session refresh fails
    }
    
    // Add security headers and pathname
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('x-pathname', pathname);

    return response;
  } catch (error) {
    console.error('Unexpected error in middleware:', error, { path: pathname });
    // Return a basic response in case of critical errors
    return NextResponse.next();
  }
}

// Define which routes this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
