/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // No remote images are currently optimized. Add only specific trusted hosts if needed.
    remotePatterns: [],
  },
};

export default nextConfig;
