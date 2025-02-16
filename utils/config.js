// utils/config.js
const isServer = typeof window === 'undefined';

export function getSiteUrl() {
  // Local dev
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Use NEXT_PUBLIC_SITE_URL if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // If all else fails, on the client use window.location.origin
  if (!isServer) {
    return window.location.origin;
  }

  throw new Error('Unable to determine site URL');
}

const config = {
  baseUrl: getSiteUrl(),
};

export default config;
