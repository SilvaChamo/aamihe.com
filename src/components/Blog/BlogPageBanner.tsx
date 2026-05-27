import './BlogLayout.css';

type BlogPageBannerProps = {
  id?: string;
  title?: string;
  imageUrl?: string;
};

export default function BlogPageBanner({
  id = 'blog-banner-start',
  title = 'BLOG',
  imageUrl,
}: BlogPageBannerProps) {
  const style = imageUrl
    ? { backgroundImage: `url(${imageUrl})` }
    : undefined;

  return (
    <section
      id={id}
      className={`blog-page-banner ${imageUrl ? 'blog-page-banner--image' : ''}`}
      style={style}
      aria-label={title}
    >
      <div className="banner-overlay" />
      {title ? <h1>{title}</h1> : null}
    </section>
  );
}
