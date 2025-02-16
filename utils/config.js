const isServer = typeof window === 'undefined';

export function getSiteUrl() {
  // Local development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Production environment
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://dailywin.app';
  }

  // Preview environment
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // If NEXT_PUBLIC_SITE_URL is set, use it as fallback
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Client-side fallback
  if (!isServer) {
    return window.location.origin;
  }

  throw new Error('Unable to determine site URL');
}

const config = {
  baseUrl: getSiteUrl(),
};

export default config;
