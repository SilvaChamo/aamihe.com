'use client';

import Link from 'next/link';
import { use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsArticleBody from '@/components/NewsArticleBody';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import BlogPageLayout from '@/components/Blog/BlogPageLayout';
import BlogSidebar from '@/components/Blog/BlogSidebar';
import { useNews } from '@/context/NewsContext';
import '@/components/Blog/BlogLayout.css';

export default function NoticiaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getNewsById, news } = useNews();
  const item = getNewsById(parseInt(id, 10));
  const published = news.filter((n) => n.status !== 'draft');

  if (!item) {
    return (
      <>
        <Header />
        <main id="main" className="blog-site-main site-main clr" role="main">
          <BlogPageBanner title="BLOG" />
          <BlogPageLayout sidebar={<BlogSidebar news={published} />}>
            <div className="single-post-content">
              <h1>Notícia não encontrada</h1>
              <p>A publicação que procura não existe ou foi removida.</p>
              <p>
                <Link href="/noticias">← Voltar ao blog</Link>
              </p>
            </div>
          </BlogPageLayout>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main" className="blog-site-main site-main clr" role="main">
        <BlogPageBanner title="" imageUrl={item.image || '/Imagens/BgNoticias.jpeg'} />
        <BlogPageLayout sidebar={<BlogSidebar news={published} currentId={item.id} />}>
          <article className="single-post-content clr">
            <h1>{item.title}</h1>
            <ul className="meta obem-default clr">
              <li className="meta-date" itemProp="datePublished">
                {item.date}
                {item.author ? ` · ${item.author}` : ''}
              </li>
            </ul>
            <div className="post-content">
              <NewsArticleBody content={item.content} className="post-content" />
            </div>
          </article>
        </BlogPageLayout>
      </main>
      <Footer />
    </>
  );
}
