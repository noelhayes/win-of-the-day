const isServer = typeof window === 'undefined';

export function getSiteUrl() {
  // Always use the publicly defined site URL if provided.
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Client-side fallback: use the current location.
  if (!isServer) {
    return window.location.origin;
  }
  // On the server, if VERCEL_URL is defined, use that.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // As a last resort in development.
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  throw new Error('Unable to determine site URL');
}

const config = {
  baseUrl: getSiteUrl(),
};

export default config;
