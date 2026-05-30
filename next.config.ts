import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'aamihe.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/documentos-gerais',
        destination: '/galeria?tipo=documentos',
        permanent: false,
      },
      {
        source: '/direccao',
        destination: '/#direcao',
        permanent: false,
      },
      {
        source: '/eventos',
        destination: '/noticias',
        permanent: false,
      },
      {
        source: '/blog',
        destination: '/noticias',
        permanent: false,
      },
      {
        source: '/Blog',
        destination: '/noticias',
        permanent: false,
      },
      {
        source: '/post',
        destination: '/noticias',
        permanent: false,
      },
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/servicos',
        destination: '/servicos.html',
      },
      {
        source: '/paises',
        destination: '/Paises membros.htm',
      },
      {
        source: '/universidades',
        destination: '/Universidades filiadas.htm',
      },
      {
        source: '/arquivo',
        destination: '/Arquivo.htm',
      },
    ];
  },
};

export default nextConfig;
