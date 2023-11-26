/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.aksharpatel47.com",
      },
    ],
  },
};

module.exports = nextConfig;
