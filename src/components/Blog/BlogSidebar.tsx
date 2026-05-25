'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { NewsItem } from '@/data/news';
import { getArchiveYears } from '@/lib/blog-utils';
import OptimizedImage from '@/components/ui/OptimizedImage';
import './BlogLayout.css';

type BlogSidebarProps = {
  news: NewsItem[];
  currentId?: number;
  onSearchChange?: (query: string) => void;
  onYearFilter?: (year: string | null) => void;
  activeYear?: string | null;
};

export default function BlogSidebar({
  news,
  currentId,
  onSearchChange,
  onYearFilter,
  activeYear,
}: BlogSidebarProps) {
  const [search, setSearch] = useState('');

  const recent = useMemo(
    () => news.filter((n) => n.id !== currentId && n.status !== 'draft').slice(0, 4),
    [news, currentId]
  );

  const years = useMemo(() => getArchiveYears(news), [news]);

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearchChange?.(value);
  };

  return (
    <aside id="right-sidebar" className="blog-right-sidebar" aria-label="Barra lateral do blog">
      <div id="right-sidebar-inner">
        <div className="blog-sidebar-box">
          <div className="search-widget">
            <form
              onSubmit={(e) => e.preventDefault()}
              role="search"
              aria-label="Pesquisar notícias"
            >
              <div className="blog-search-wrap">
                <input
                  type="search"
                  name="s"
                  placeholder="Procurar..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <svg viewBox="0 0 512 512" aria-hidden="true">
                  <path
                    fill="#aaa"
                    d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
                  />
                </svg>
              </div>
            </form>
          </div>
        </div>

        <div className="blog-sidebar-box">
          <h4 className="widget-title">Últimas Notícias</h4>
          <div className="recent-posts-widget">
            {recent.map((item) => (
              <div key={item.id} className="recent-post-card">
                <div className="post-img">
                  {item.image?.trim() ? (
                    <OptimizedImage
                      src={item.image.trim()}
                      alt=""
                      width={72}
                      height={72}
                      className="blog-sidebar-thumb-image"
                      sizes="72px"
                      quality={70}
                    />
                  ) : (
                    <div className="blog-sidebar-thumb-placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="post-title">
                  <Link href={`/noticias/${item.id}`}>{item.title}</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {years.length > 0 && (
          <div className="blog-sidebar-box">
            <h4 className="widget-title">Arquivo</h4>
            <ul className="archive-list">
              <li>
                <button
                  type="button"
                  className="archive-list-btn"
                  onClick={() => onYearFilter?.(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: activeYear ? '#333' : '#cca876',
                    fontWeight: 'bold',
                    fontSize: 14,
                  }}
                >
                  Todos
                </button>
              </li>
              {years.map((year) => (
                <li key={year}>
                  <button
                    type="button"
                    className="archive-list-btn"
                    onClick={() => onYearFilter?.(year)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: activeYear === year ? '#cca876' : '#333',
                      fontWeight: 'bold',
                      fontSize: 14,
                    }}
                  >
                    {year}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
