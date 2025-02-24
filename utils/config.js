const isServer = typeof window === 'undefined';

export function getSiteUrl() {
  // Always use the publicly defined site URL if provided.
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Detect environment from Vercel variables
  const vercelEnv = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development'
  const vercelUrl = process.env.VERCEL_URL; // e.g., 'win-of-the-3ite4es91-noelhayes-projects.vercel.app'

  // Handle different Vercel deployment environments
  if (vercelEnv === 'production') {
    return 'https://www.dailywin.app';
  }

  if (vercelEnv === 'preview' && vercelUrl) {
    return `https://preview.dailywin.app`;
  }

  // Client-side fallback: use the current location if in browser
  if (!isServer) {
    return window.location.origin;
  }

  // As a last resort for local development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  throw new Error('Unable to determine site URL');
}

const config = {
  baseUrl: getSiteUrl(),
  isServer,
  environment: process.env.NODE_ENV || 'development',
};

export default config;
