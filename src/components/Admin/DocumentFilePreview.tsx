'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import {
  getFileTypeLabel,
  isPdfPreviewable,
  isWordFile,
} from '@/lib/conference-document-files';

type DocumentFilePreviewProps = {
  url: string;
  title: string;
  mimeType?: string;
  lazy?: boolean;
};

export default function DocumentFilePreview({
  url,
  title,
  mimeType,
  lazy = true,
}: DocumentFilePreviewProps) {
  const [previewReady, setPreviewReady] = useState(false);

  if (isPdfPreviewable(url, mimeType)) {
    return (
      <div className="docs-preview-thumb">
        {!previewReady ? (
          <div className="docs-preview-thumb-skeleton wp-skeleton-pulse" aria-hidden />
        ) : null}
        <iframe
          src={`${url}#toolbar=0&navpanes=0&view=FitH`}
          title={`Pré-visualização — ${title}`}
          loading={lazy ? 'lazy' : undefined}
          tabIndex={-1}
          onLoad={() => setPreviewReady(true)}
          className={previewReady ? 'docs-preview-thumb-frame is-ready' : 'docs-preview-thumb-frame'}
        />
      </div>
    );
  }

  const label = isWordFile(url, mimeType) ? 'Word' : getFileTypeLabel(url);

  return (
    <div className="docs-subscriber-file-icon" aria-hidden>
      <FileText size={34} />
      <span>{label}</span>
    </div>
  );
}
