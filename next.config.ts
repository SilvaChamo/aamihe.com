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
        source: '/blog',
        destination: '/Blog.html',
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
