import type { ReactNode } from 'react';
import './BlogLayout.css';

type BlogPageLayoutProps = {
  children: ReactNode;
  sidebar: ReactNode;
};

export default function BlogPageLayout({ children, sidebar }: BlogPageLayoutProps) {
  return (
    <div id="content-wrap" className="blog-content-wrap container clr">
      <div id="primary" className="blog-primary content-area clr">
        <div id="content" className="site-content clr">
          {children}
        </div>
      </div>
      {sidebar}
    </div>
  );
}
