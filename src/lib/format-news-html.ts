/** Detecta conteúdo exportado do WordPress / editor HTML. */
export function isHtmlContent(text: string): boolean {
  return /<(?:p|div|br|h[1-6]|ul|ol|li|strong|em|b|i|a|blockquote|figure|img)\b/i.test(text);
}

/** Remove estilos WordPress e atributos perigosos; mantém estrutura legível. */
export function sanitizeNewsHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\s(on\w+)\s*=\s*(".*?"|'[^']*')/gi, '')
    .replace(/\sstyle\s*=\s*(".*?"|'[^']*')/gi, '')
    .replace(/\sclass\s*=\s*(".*?"|'[^']*')/gi, '')
    .replace(/<\/?span[^>]*>/gi, '')
    .trim();
}

export function stripHtmlToText(html: string, maxLength = 200): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function plainTextParagraphs(text: string): string[] {
  const withoutTags = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!withoutTags) return [];
  return text
    .split(/\n+/)
    .map((line) => line.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
}
