// Helper to get site URL, forcing localhost in development
export const getSiteUrl = () => {
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_SITE_URL;
};
