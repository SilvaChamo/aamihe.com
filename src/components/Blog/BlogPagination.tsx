'use client';

import './BlogLayout.css';

type BlogPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

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
            onClick={() => onPageChange(page - 1)}
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
                  onClick={() => onPageChange(pageNum)}
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
            onClick={() => onPageChange(page + 1)}
            aria-label="Página seguinte"
          >
            →
          </button>
        </li>
      </ul>
    </nav>
  );
}
