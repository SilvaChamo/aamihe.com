import './BlogLayout.css';

type BlogPageBannerProps = {
  title?: string;
  imageUrl?: string;
};

export default function BlogPageBanner({ title = 'BLOG', imageUrl }: BlogPageBannerProps) {
  const style = imageUrl
    ? { backgroundImage: `url(${imageUrl})` }
    : undefined;

  return (
    <section
      id="blog-banner-start"
      className={`blog-page-banner ${imageUrl ? 'blog-page-banner--image' : ''}`}
      style={style}
      aria-label={title}
    >
      <div className="banner-overlay" />
      {title ? <h1>{title}</h1> : null}
    </section>
  );
}
