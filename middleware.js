import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

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
setInterval(() => TokenBucket.cleanup(), 60000);

export async function middleware(req) {
  // Get client IP
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  // Check rate limit
  const bucket = TokenBucket.buckets.get(ip) || new TokenBucket(ip);
  if (!bucket.tryConsume()) {
    const response = NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: securityHeaders
      }
    );
    return response;
  }

  // Update the session
  const response = await updateSession(req);
  
  // Add security headers if response exists
  if (response && response.headers) {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

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
