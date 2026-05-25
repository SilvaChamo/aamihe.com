import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/documentos-gerais',
        destination: '/galeria?tipo=documentos',
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
        source: '/Blog',
        destination: '/Blog.html',
      },
      {
        source: '/contacte-nos',
        destination: '/contacte-nos.html',
      },
      {
        source: '/post',
        destination: '/post.html',
      },
    ];
  },
};

export default nextConfig;
