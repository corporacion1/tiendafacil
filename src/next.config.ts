/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'jdbqvzpjdyaksuaxhmty.db.co',
      'images.unsplash.com',
      'i.imgur.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jdbqvzpjdyaksuaxhmty.db.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@db/db-js'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig