'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import BlogPageLayout from '@/components/Blog/BlogPageLayout';
import BlogEntryCard from '@/components/Blog/BlogEntryCard';
import BlogPagination from '@/components/Blog/BlogPagination';
import BlogSidebar from '@/components/Blog/BlogSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalizedNews } from '@/hooks/useLocalizedNews';
import { useSitePageConfig } from '@/hooks/useSitePageConfig';
import { filterNewsByQuery, filterNewsByYear } from '@/lib/blog-utils';
import { scrollBelowSiteHeader } from '@/lib/scroll-page-top';
import '@/components/Blog/BlogLayout.css';

export default function NoticiasPage() {
  const { locale } = useLanguage();
  const { news } = useLocalizedNews();
  const t = {
    pt: { empty: 'Nenhuma notícia encontrada. Tente outra pesquisa ou ano.' },
    fr: { empty: 'Aucune actualité trouvée. Essayez une autre recherche ou année.' },
    en: { empty: 'No news found. Try another search or year.' },
  } as const;
  const tx = t[locale];

  const { pages } = useSitePageConfig();
  const perPage = pages.blog.postsPerPage;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const published = useMemo(
    () => news.filter((item) => item.status !== 'draft'),
    [news]
  );

  const filtered = useMemo(() => {
    let items = published;
    if (activeYear) items = filterNewsByYear(items, activeYear);
    if (searchQuery) items = filterNewsByQuery(items, searchQuery);
    return items;
  }, [published, activeYear, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      if (pages.blog.scrollToTopOnPaginate) {
        const anchorId =
          pages.blog.scrollTargetOnPaginate === 'banner' ? 'blog-banner-start' : 'blog-content-start';
        requestAnimationFrame(() => {
          scrollBelowSiteHeader(anchorId, 'smooth');
        });
      }
    },
    [pages.blog.scrollToTopOnPaginate, pages.blog.scrollTargetOnPaginate]
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeYear]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <>
      <Header />
      <main id="main" className="blog-site-main site-main clr" role="main">
        <BlogPageBanner title={pages.blog.bannerTitle} imageUrl={pages.blog.bannerImage} />
        <div id="blog-content-start" className="blog-content-anchor" aria-hidden="true" />
        <BlogPageLayout
          sidebar={
            <BlogSidebar
              news={published}
              onSearchChange={setSearchQuery}
              onYearFilter={setActiveYear}
              activeYear={activeYear}
            />
          }
        >
          <div className="blog-entries-wrap">
            <div
              id="blog-entries"
              className="entries clr"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, pages.blog.gridColumns)}, minmax(0, 1fr))`,
              }}
            >
              {filtered.length === 0 ? (
                <p className="blog-empty-state">
                  {tx.empty}
                </p>
              ) : (
                paginated.map((item) => (
                  <BlogEntryCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    image={item.image}
                    date={item.date}
                  />
                ))
              )}
            </div>

            {filtered.length > 0 && (
              <BlogPagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </BlogPageLayout>
      </main>
      <Footer />
    </>
  );
}
