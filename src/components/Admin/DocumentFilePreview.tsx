'use client';

import { FileText } from 'lucide-react';
import { getFileTypeLabel, isPdfPreviewable } from '@/lib/conference-document-files';

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
  if (isPdfPreviewable(url, mimeType)) {
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0&view=FitH`}
        title={`Pré-visualização — ${title}`}
        loading={lazy ? 'lazy' : undefined}
        tabIndex={-1}
      />
    );
  }

  return (
    <div className="docs-subscriber-file-icon" aria-hidden>
      <FileText size={34} />
      <span>{getFileTypeLabel(url)}</span>
    </div>
  );
}
