/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google OAuth profile pictures
      'avatars.githubusercontent.com', // GitHub profile pictures (if you add GitHub auth)
      'yvdkzqcqmqmgvwxjxiop.supabase.co' // Your Supabase storage domain
    ]
  },
  webpack: (config, { isServer }) => {
    // Ignore WebSocket warnings
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
