'use client';

import Link from 'next/link';
import { use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsArticleBody from '@/components/NewsArticleBody';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import BlogPageLayout from '@/components/Blog/BlogPageLayout';
import BlogSidebar from '@/components/Blog/BlogSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalizedNews } from '@/hooks/useLocalizedNews';
import overlay from '@/components/Site/PageOverlayCard.module.css';
import '@/components/Blog/BlogLayout.css';

export default function NoticiaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { locale } = useLanguage();
  const { id } = use(params);
  const { getNewsById, news } = useLocalizedNews();
  const item = getNewsById(parseInt(id, 10));
  const published = news.filter((n) => n.status !== 'draft');
  const t = {
    pt: {
      banner: 'BLOG',
      newsBanner: 'NOTÍCIA',
      notFoundTitle: 'Notícia não encontrada',
      notFoundText: 'A publicação que procura não existe ou foi removida.',
      back: '← Voltar ao blog',
    },
    fr: {
      banner: 'BLOG',
      newsBanner: 'ACTUALITÉ',
      notFoundTitle: 'Actualité introuvable',
      notFoundText: 'La publication recherchée n’existe pas ou a été supprimée.',
      back: '← Retour au blog',
    },
    en: {
      banner: 'BLOG',
      newsBanner: 'NEWS',
      notFoundTitle: 'News not found',
      notFoundText: 'The post you are looking for does not exist or was removed.',
      back: '← Back to blog',
    },
  } as const;
  const tx = t[locale];

  if (!item) {
    return (
      <>
        <Header />
        <main id="main" className={`blog-site-main site-main clr ${overlay.main}`} role="main">
          <BlogPageBanner title={tx.banner} />
          <section className={overlay.section} aria-label={tx.banner}>
            <div className="container">
              <div className={overlay.contentCard}>
                <BlogPageLayout embedded sidebar={<BlogSidebar news={published} />}>
                  <div className="single-post-content">
                    <h1>{tx.notFoundTitle}</h1>
                    <p>{tx.notFoundText}</p>
                    <p>
                      <Link href="/noticias">{tx.back}</Link>
                    </p>
                  </div>
                </BlogPageLayout>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main" className={`blog-site-main site-main clr ${overlay.main}`} role="main">
        <BlogPageBanner
          id="article-banner"
          title={tx.newsBanner}
          breadcrumbLabel={item.title}
          imageUrl={item.image || '/Imagens/BgNoticias.jpeg'}
        />
        <section className={overlay.section} aria-label={tx.newsBanner}>
          <div className="container">
            <div className={overlay.contentCard}>
              <BlogPageLayout embedded sidebar={<BlogSidebar news={published} currentId={item.id} />}>
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
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
