/**
 * Gets the site URL based on the current environment
 * Handles:
 * - Local development (localhost:3000)
 * - Vercel preview deployments (*.vercel.app)
 * - Production deployment (dailywin.app)
 */
export const getSiteUrl = () => {
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("VERCEL_URL:", process.env.VERCEL_URL);
  console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);
  
  // Always use localhost for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // For Vercel deployments, use their environment variables
  // VERCEL_URL includes the full URL for preview deployments
  if (process.env.VERCEL_URL) {
    // VERCEL_URL doesn't include protocol
    return `https://${process.env.VERCEL_URL}`;
  }

  // For production deployment
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback to window.location.origin if available (client-side)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Final fallback to production URL
  // This should rarely be used, but provides a safety net
  return 'https://www.dailywin.app';
};
