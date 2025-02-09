/**
 * Gets the site URL based on the current environment
 * Handles:
 * - Local development (localhost:3000)
 * - Vercel preview deployments (*.vercel.app)
 * - Production deployment (dailywin.app)
 * 
 * Note: VERCEL_URL is only available server-side
 */

// Check if we're running on the server
const isServer = typeof window === 'undefined';

export const getSiteUrl = () => {
  console.log("Running on:", isServer ? "server" : "client");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  if (isServer) {
    console.log("VERCEL_URL:", process.env.VERCEL_URL);
  }
  console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);
  
  // Always use localhost for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // For Vercel deployments, use VERCEL_URL if available (server-side only)
  if (isServer && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // For production deployment or client-side code
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback to window.location.origin if available (client-side)
  if (!isServer) {
    return window.location.origin;
  }

  // Final fallback to production URL
  // This should rarely be used, but provides a safety net
  return 'https://www.dailywin.app';
};
