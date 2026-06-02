'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  getFileTypeLabel,
  getOfficeEmbedPreviewUrl,
  isPdfPreviewable,
  isWordPreviewable,
} from '@/lib/conference-document-files';

type DocumentFilePreviewProps = {
  url: string;
  title: string;
  mimeType?: string;
  lazy?: boolean;
  /** card = miniatura na grelha; reader = painel de revisão admin */
  layout?: 'card' | 'reader';
};

const WORD_PREVIEW_SETTLE_MS = 900;

export default function DocumentFilePreview({
  url,
  title,
  mimeType,
  lazy = true,
  layout = 'card',
}: DocumentFilePreviewProps) {
  const [previewReady, setPreviewReady] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPreviewReady(false);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [url]);

  function markPreviewReady(isWord: boolean) {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (isWord) {
      settleTimer.current = setTimeout(() => setPreviewReady(true), WORD_PREVIEW_SETTLE_MS);
      return;
    }
    setPreviewReady(true);
  }

  const wrapperClass =
    layout === 'reader' ? 'docs-preview-reader' : 'docs-preview-thumb';

  if (isPdfPreviewable(url, mimeType)) {
    const src =
      layout === 'reader'
        ? `${url}#toolbar=1&navpanes=0&view=FitH`
        : `${url}#toolbar=0&navpanes=0&view=FitH`;

    return (
      <div className={wrapperClass}>
        {!previewReady ? (
          <div className="docs-preview-thumb-skeleton wp-skeleton-pulse" aria-hidden />
        ) : null}
        <iframe
          src={src}
          title={`Pré-visualização — ${title}`}
          loading={lazy ? 'lazy' : undefined}
          tabIndex={-1}
          onLoad={() => markPreviewReady(false)}
          className={
            previewReady ? 'docs-preview-thumb-frame is-ready' : 'docs-preview-thumb-frame'
          }
        />
      </div>
    );
  }

  if (isWordPreviewable(url, mimeType)) {
    return (
      <div className={wrapperClass}>
        {!previewReady ? (
          <div className="docs-preview-thumb-skeleton wp-skeleton-pulse" aria-hidden />
        ) : null}
        <iframe
          src={getOfficeEmbedPreviewUrl(url)}
          title={`Pré-visualização Word — ${title}`}
          loading={lazy ? 'lazy' : undefined}
          tabIndex={-1}
          onLoad={() => markPreviewReady(true)}
          className={
            previewReady ? 'docs-preview-thumb-frame is-ready' : 'docs-preview-thumb-frame'
          }
        />
      </div>
    );
  }

  return (
    <div className="docs-subscriber-file-icon" aria-hidden>
      <FileText size={34} />
      <span>{getFileTypeLabel(url)}</span>
    </div>
  );
}
