'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import BlogPageLayout from '@/components/Blog/BlogPageLayout';
import BlogEntryCard from '@/components/Blog/BlogEntryCard';
import BlogPagination from '@/components/Blog/BlogPagination';
import BlogSidebar from '@/components/Blog/BlogSidebar';
import { useNews } from '@/context/NewsContext';
import { filterNewsByQuery, filterNewsByYear } from '@/lib/blog-utils';
import '@/components/Blog/BlogLayout.css';

const PER_PAGE = 4;

export default function NoticiasPage() {
  const { news } = useNews();
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

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
        <BlogPageBanner title="BLOG" />
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
            <div id="blog-entries" className="entries clr">
              {filtered.length === 0 ? (
                <p className="blog-empty-state">
                  Nenhuma notícia encontrada. Tente outra pesquisa ou ano.
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
              <BlogPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </div>
        </BlogPageLayout>
      </main>
      <Footer />
    </>
  );
}
