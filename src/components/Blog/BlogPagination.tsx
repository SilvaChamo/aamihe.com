'use client';

import type { MouseEvent } from 'react';
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
  if (totalPages <= 1) return null;

  return (
    <nav className="blog-pagination" aria-label="Paginação do blog">
      <ul className="blog-pagination-list">
        <li>
          <button
            type="button"
            className="blog-page-number blog-page-prev"
            disabled={page <= 1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => handlePaginate(e, page - 1, onPageChange)}
            aria-label="Página anterior"
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
            aria-label="Página seguinte"
          >
            →
          </button>
        </li>
      </ul>
    </nav>
  );
}
