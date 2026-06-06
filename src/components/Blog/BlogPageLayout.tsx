import type { ReactNode } from 'react';
import './BlogLayout.css';

type BlogPageLayoutProps = {
  children: ReactNode;
  sidebar: ReactNode;
  embedded?: boolean;
};

export default function BlogPageLayout({ children, sidebar, embedded = false }: BlogPageLayoutProps) {
  return (
    <div
      id="content-wrap"
      className={`blog-content-wrap clr${embedded ? '' : ' container'}`}
    >
      <div id="primary" className="blog-primary content-area clr">
        <div id="content" className="site-content clr">
          {children}
        </div>
      </div>
      {sidebar}
    </div>
  );
}
