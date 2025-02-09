const getBaseUrl = () => {
  // Check if we're running on the server side
  if (typeof window === 'undefined') {
    // On server side, respect development mode
    return process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // On client side, also respect development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // In production, use the window.location.origin
  return window.location.origin;
};

const config = {
  baseUrl: getBaseUrl(),
  // Add other configuration values here
};

export default config;
