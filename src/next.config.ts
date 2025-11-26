/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'jdbqvzpjdyaksuaxhmty.supabase.co',
      'images.unsplash.com',
      'i.imgur.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jdbqvzpjdyaksuaxhmty.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig