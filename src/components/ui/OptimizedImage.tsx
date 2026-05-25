'use client';

import Image from 'next/image';
import { canOptimizeImageSrc, normalizeImageSrc } from '@/lib/image-src';

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  quality?: number;
};

export default function OptimizedImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
  fill = false,
  width,
  height,
  quality = 75,
}: OptimizedImageProps) {
  const normalized = normalizeImageSrc(src);
  if (!normalized) return null;

  if (!canOptimizeImageSrc(normalized)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={normalized}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={normalized}
        alt={alt}
        className={className}
        fill
        sizes={sizes ?? '100vw'}
        priority={priority}
        quality={quality}
      />
    );
  }

  return (
    <Image
      src={normalized}
      alt={alt}
      className={className}
      width={width ?? 800}
      height={height ?? 600}
      sizes={sizes ?? '(max-width: 1200px) 100vw, 1200px'}
      priority={priority}
      quality={quality}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
