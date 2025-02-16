/**
 * Application configuration and environment-aware URL handling
 * Handles:
 * - Local development (localhost:3000)
 * - Vercel preview deployments (preview.dailywin.app)
 * - Production deployment (dailywin.app)
 * 
 * Note: VERCEL_URL is only available server-side
 */

// Check if we're running on the server
const isServer = typeof window === 'undefined';

export const getSiteUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // For Vercel deployments, use VERCEL_URL if available (server-side only)
  if (isServer && process.env.VERCEL_URL) {
    return `https://preview.dailywin.app`;
  }

  // For production
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback to window.location.origin for client-side production
  if (!isServer) {
    return window.location.origin;
  }

  throw new Error('Unable to determine site URL');
};

const config = {
  baseUrl: getSiteUrl(),
  // Add other configuration values here as needed
};

export default config;
