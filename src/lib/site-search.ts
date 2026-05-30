export type SiteSearchChunk = {
  id: string;
  href: string;
  title: string;
  body: string;
  image?: string;
  summary?: string;
};

export type SiteSearchResult = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
  image?: string;
  score: number;
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenizeQuery(query: string): string[] {
  return normalizeSearchText(query).split(/\s+/).filter(Boolean);
}

function getSearchableText(chunk: SiteSearchChunk): string {
  return normalizeSearchText(
    [chunk.title, chunk.summary, chunk.body].filter(Boolean).join(' '),
  );
}

function queryMatches(searchable: string, normalizedQuery: string, tokens: string[]): boolean {
  if (!normalizedQuery) return false;
  if (searchable.includes(normalizedQuery)) return true;
  if (tokens.length === 0) return false;
  return tokens.every((token) => searchable.includes(token));
}

function scoreChunk(chunk: SiteSearchChunk, normalizedQuery: string, tokens: string[]): number {
  const title = normalizeSearchText(chunk.title);
  const summary = normalizeSearchText(chunk.summary || '');
  const body = normalizeSearchText(chunk.body);
  const searchable = getSearchableText(chunk);

  if (!queryMatches(searchable, normalizedQuery, tokens)) return 0;

  if (title.includes(normalizedQuery)) return 100;
  if (summary.includes(normalizedQuery)) return 95;
  if (body.includes(normalizedQuery)) return 90;

  if (tokens.length > 0 && tokens.every((token) => title.includes(token))) return 85;
  if (tokens.length > 0 && tokens.every((token) => summary.includes(token))) return 80;
  if (tokens.length > 0 && tokens.every((token) => body.includes(token))) return 75;

  return 70;
}

function buildExcerpt(body: string, query: string, maxLength = 180): string {
  const plain = body.replace(/\s+/g, ' ').trim();
  if (!plain) return '';

  const normalizedPlain = normalizeSearchText(plain);
  const normalizedQuery = normalizeSearchText(query);
  const matchIndex = normalizedPlain.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    const tokens = tokenizeQuery(query);
    const firstToken = tokens.find((token) => normalizedPlain.includes(token));
    if (firstToken) {
      const tokenIndex = normalizedPlain.indexOf(firstToken);
      const start = Math.max(0, tokenIndex - 40);
      const slice = plain.slice(start, start + maxLength);
      return `${start > 0 ? '…' : ''}${slice}${start + maxLength < plain.length ? '…' : ''}`;
    }
    return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain;
  }

  const start = Math.max(0, matchIndex - 50);
  const slice = plain.slice(start, start + maxLength);
  const prefix = start > 0 ? '…' : '';
  const suffix = start + maxLength < plain.length ? '…' : '';
  return `${prefix}${slice}${suffix}`;
}

function buildResultSummary(chunk: SiteSearchChunk, query: string): string {
  const summary = chunk.summary?.trim();
  const bodyPlain = stripHtml(chunk.body);

  if (summary) {
    const normalizedSummary = normalizeSearchText(summary);
    const normalizedQuery = normalizeSearchText(query);
    const tokens = tokenizeQuery(query);
    if (
      normalizedSummary.includes(normalizedQuery) ||
      tokens.every((token) => normalizedSummary.includes(token))
    ) {
      return summary.length > 200 ? `${summary.slice(0, 200)}…` : summary;
    }
  }

  if (bodyPlain) {
    return buildExcerpt(bodyPlain, query);
  }

  return chunk.title;
}

export function searchSiteContent(
  chunks: SiteSearchChunk[],
  query: string,
  limit = 20,
): SiteSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeQuery(query);
  if (!normalizedQuery) return [];

  const results: SiteSearchResult[] = [];
  const seenIds = new Set<string>();

  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, normalizedQuery, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const { chunk, score } of scored) {
    if (seenIds.has(chunk.id)) continue;

    const excerpt = buildResultSummary(chunk, query);
    if (!excerpt.trim()) continue;

    seenIds.add(chunk.id);

    results.push({
      id: chunk.id,
      href: chunk.href,
      title: chunk.title,
      excerpt,
      image: chunk.image?.trim() || undefined,
      score,
    });

    if (results.length >= limit) break;
  }

  return results;
}
