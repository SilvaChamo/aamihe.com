import Link from 'next/link';
import './BlogLayout.css';

type BlogEntryCardProps = {
  id: number;
  title: string;
  image: string;
  date: string;
};

export default function BlogEntryCard({ id, title, image, date }: BlogEntryCardProps) {
  const href = `/noticias/${id}`;
  const imageSrc = image?.trim() || null;

  return (
    <article className="blog-entry clr large-entry has-media">
      <Link href={href} className="blog-entry-link" aria-label={`Ler: ${title}`}>
        <div className="blog-entry-inner clr">
          <div className="thumbnail">
            <div className="thumbnail-link">
              {imageSrc ? (
                <img src={imageSrc} alt="" loading="lazy" />
              ) : (
                <div className="blog-entry-thumbnail-placeholder" aria-hidden="true" />
              )}
              <span className="overlay" aria-hidden="true" />
            </div>
          </div>

          <p className="blog-entry-date">
            <span className="blog-entry-date-label">Publicado em:</span> {date}
          </p>

          <header className="blog-entry-header clr">
            <h2 className="blog-entry-title entry-title">{title}</h2>
          </header>

          <div className="blog-entry-readmore clr">
            <span className="blog-entry-readmore-text">Continuar a ler</span>
            <span className="blog-entry-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
