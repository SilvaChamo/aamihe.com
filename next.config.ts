import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
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
        source: '/sobre-nos',
        destination: '/sobre-nos.html',
      },
      {
        source: '/servicos',
        destination: '/servicos.html',
      },
      {
        source: '/conferencia',
        destination: '/conferencia.html',
      },
      {
        source: '/contacte-nos',
        destination: '/contacte-nos.html',
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
