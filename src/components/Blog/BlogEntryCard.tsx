import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { siteGalleryImage } from '@/lib/site-gallery-image';
import './BlogLayout.css';

type BlogEntryCardProps = {
  id: number;
  title: string;
  image: string;
  date: string;
};

export default function BlogEntryCard({ id, title, image, date }: BlogEntryCardProps) {
  const { locale } = useLanguage();
  const t = {
    pt: { readAria: 'Ler', publishedOn: 'Publicado em:', continue: 'Continuar a ler' },
    fr: { readAria: 'Lire', publishedOn: 'Publié le :', continue: 'Continuer la lecture' },
    en: { readAria: 'Read', publishedOn: 'Published on:', continue: 'Continue reading' },
  } as const;
  const tx = t[locale];
  const href = `/noticias/${id}`;
  const imageSrc = image?.trim() ? siteGalleryImage(image) : null;

  return (
    <article className="blog-entry clr large-entry has-media">
      <Link href={href} className="blog-entry-link" aria-label={`${tx.readAria}: ${title}`}>
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
            <span className="blog-entry-date-label">{tx.publishedOn}</span> {date}
          </p>

          <header className="blog-entry-header clr">
            <h2 className="blog-entry-title entry-title">{title}</h2>
          </header>

          <div className="blog-entry-readmore clr">
            <span className="blog-entry-readmore-text">{tx.continue}</span>
            <span className="blog-entry-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
