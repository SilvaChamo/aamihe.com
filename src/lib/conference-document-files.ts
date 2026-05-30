export const CONFERENCE_MAX_FILES = 10;
export const CONFERENCE_MAX_FILE_BYTES = 15 * 1024 * 1024;

export const CONFERENCE_ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'txt',
  'rtf',
] as const;

export type ConferenceAllowedExtension = (typeof CONFERENCE_ALLOWED_EXTENSIONS)[number];

const EXTENSION_MIME: Record<ConferenceAllowedExtension, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  csv: ['text/csv', 'application/csv', 'text/plain'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  odt: ['application/vnd.oasis.opendocument.text'],
  ods: ['application/vnd.oasis.opendocument.spreadsheet'],
  odp: ['application/vnd.oasis.opendocument.presentation'],
  txt: ['text/plain'],
  rtf: ['application/rtf', 'text/rtf'],
};

export const CONFERENCE_FILE_ACCEPT = CONFERENCE_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

export function getFileExtension(nameOrUrl: string): string {
  const clean = nameOrUrl.split('?')[0].split('#')[0];
  const ext = clean.split('.').pop()?.toLowerCase() || '';
  return ext;
}

export function isAllowedConferenceExtension(ext: string): ext is ConferenceAllowedExtension {
  return (CONFERENCE_ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export function isPdfFile(nameOrUrl: string, mimeType?: string): boolean {
  if (mimeType === 'application/pdf') return true;
  return getFileExtension(nameOrUrl) === 'pdf';
}

export function isPdfPreviewable(nameOrUrl: string, mimeType?: string): boolean {
  return isPdfFile(nameOrUrl, mimeType);
}

export function getFileTypeLabel(nameOrUrl: string): string {
  const ext = getFileExtension(nameOrUrl);
  const labels: Record<string, string> = {
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    xls: 'Excel',
    xlsx: 'Excel',
    csv: 'CSV',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    odt: 'ODT',
    ods: 'ODS',
    odp: 'ODP',
    txt: 'TXT',
    rtf: 'RTF',
  };
  return labels[ext] || ext.toUpperCase() || 'DOC';
}

export function titleFromFileName(fileName: string): string {
  const ext = getFileExtension(fileName);
  if (!ext) return fileName;
  return fileName.replace(new RegExp(`\\.${ext}$`, 'i'), '');
}

export function resolveConferenceMimeType(file: File): string | null {
  const ext = getFileExtension(file.name);
  if (!isAllowedConferenceExtension(ext)) return null;

  const allowed = EXTENSION_MIME[ext];
  if (file.type && allowed.includes(file.type)) {
    return file.type;
  }

  return allowed[0] || null;
}

export function validateConferenceFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: 'Ficheiro vazio.' };
  }

  if (file.size > CONFERENCE_MAX_FILE_BYTES) {
    return { ok: false, error: `«${file.name}» excede o limite de 15 MB.` };
  }

  const mime = resolveConferenceMimeType(file);
  if (!mime) {
    return {
      ok: false,
      error: `Formato não suportado: «${file.name}». Use PDF, Word, Excel, PowerPoint ou formatos comuns.`,
    };
  }

  return { ok: true };
}
