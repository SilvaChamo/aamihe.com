'use client';

import type { MouseEvent } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import './BlogLayout.css';

type BlogPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function handlePaginate(
  e: MouseEvent<HTMLButtonElement>,
  nextPage: number,
  onPageChange: (page: number) => void,
) {
  e.preventDefault();
  (e.currentTarget as HTMLButtonElement).blur();
  onPageChange(nextPage);
}

export default function BlogPagination({ page, totalPages, onPageChange }: BlogPaginationProps) {
  const { locale } = useLanguage();
  const t = {
    pt: { nav: 'Paginação do blog', prev: 'Página anterior', next: 'Página seguinte' },
    fr: { nav: 'Pagination du blog', prev: 'Page précédente', next: 'Page suivante' },
    en: { nav: 'Blog pagination', prev: 'Previous page', next: 'Next page' },
  } as const;
  const tx = t[locale];
  if (totalPages <= 1) return null;

  return (
    <nav className="blog-pagination" aria-label={tx.nav}>
      <ul className="blog-pagination-list">
        <li>
          <button
            type="button"
            className="blog-page-number blog-page-prev"
            disabled={page <= 1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => handlePaginate(e, page - 1, onPageChange)}
            aria-label={tx.prev}
          >
            ←
          </button>
        </li>
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNum = index + 1;
          return (
            <li key={pageNum}>
              {pageNum === page ? (
                <span className="blog-page-number current" aria-current="page">
                  {pageNum}
                </span>
              ) : (
                <button
                  type="button"
                  className="blog-page-number"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => handlePaginate(e, pageNum, onPageChange)}
                >
                  {pageNum}
                </button>
              )}
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="blog-page-number blog-page-next"
            disabled={page >= totalPages}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => handlePaginate(e, page + 1, onPageChange)}
            aria-label={tx.next}
          >
            →
          </button>
        </li>
      </ul>
    </nav>
  );
}
