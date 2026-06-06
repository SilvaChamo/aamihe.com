import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },
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
        hostname: 'supabase.visualdesignmoz.com',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.aamihe.com',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'aamihe.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/admin/dashboard',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: '/dashboard/:path*',
        permanent: false,
      },
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
        source: '/galeria-de-fotos',
        destination: '/galeria',
        permanent: true,
      },
      {
        source: '/paises-membros',
        destination: '/paises',
        permanent: true,
      },
      {
        source: '/universidades-filiadas',
        destination: '/universidades',
        permanent: true,
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
        source: '/images/:path*',
        destination: '/gallery/:path*',
      },
      {
        source: '/Imagens/:path*',
        destination: '/gallery/:path*',
      },
      {
        source: '/servicos',
        destination: '/servicos.html',
      },
    ];
  },
};

export default nextConfig;
