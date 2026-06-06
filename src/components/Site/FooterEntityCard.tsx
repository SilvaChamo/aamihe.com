import { ExternalLink } from 'lucide-react';
import { normalizeImageSrc } from '@/lib/image-src';
import styles from './FooterPages.module.css';

type FooterEntityCardProps = {
  name: string;
  flagImage?: string;
  flagEmoji?: string;
  website?: string;
  visitLabel?: string;
};

export default function FooterEntityCard({
  name,
  flagImage,
  flagEmoji,
  website,
  visitLabel,
}: FooterEntityCardProps) {
  const src = flagImage ? normalizeImageSrc(flagImage) ?? flagImage : undefined;

  const flag = (
    <div className={styles['entity-flag']} aria-hidden={website ? undefined : true}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : flagEmoji ? (
        <span className={styles['entity-flag-emoji']}>{flagEmoji}</span>
      ) : (
        <span className={styles['entity-flag-emoji']}>🏳️</span>
      )}
    </div>
  );

  if (website) {
    return (
      <a
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles['entity-card']} ${styles['entity-card-link']}`}
      >
        {flag}
        <div className={styles['entity-body']}>
          <h2 className={styles['entity-name']}>{name}</h2>
          {visitLabel ? (
            <span className={styles['entity-visit']}>
              {visitLabel}
              <ExternalLink size={14} aria-hidden="true" />
            </span>
          ) : null}
        </div>
      </a>
    );
  }

  return (
    <article className={styles['entity-card']}>
      {flag}
      <div className={styles['entity-body']}>
        <h2 className={styles['entity-name']}>{name}</h2>
      </div>
    </article>
  );
}
