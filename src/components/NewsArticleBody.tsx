'use client';

import { isHtmlContent, plainTextParagraphs, sanitizeNewsHtml } from '@/lib/format-news-html';

type Props = {
  content: string;
  className?: string;
};

export default function NewsArticleBody({ content, className = 'noticias-body' }: Props) {
  if (!content?.trim()) return null;

  if (isHtmlContent(content)) {
    return (
      <div
        className={`${className} ${className}--html`}
        dangerouslySetInnerHTML={{ __html: sanitizeNewsHtml(content) }}
      />
    );
  }

  const paragraphs = plainTextParagraphs(content);
  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
