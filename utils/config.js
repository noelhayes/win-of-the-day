const getBaseUrl = () => {
  // Check if we're running on the server side
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }
  // On the client side, use the window.location.origin
  return window.location.origin;
};

const config = {
  baseUrl: getBaseUrl(),
  // Add other configuration values here
};

export default config;
