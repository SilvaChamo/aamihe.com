/** Scroll para o início do conteúdo, abaixo do header fixo. */
export function scrollBelowSiteHeader(anchorId: string, behavior: ScrollBehavior = 'smooth') {
  if (typeof window === 'undefined') return;

  const headerHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--site-header-height') || '118',
    10,
  );

  const anchor = document.getElementById(anchorId);
  if (!anchor) {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const top = anchor.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
  window.scrollTo({ top: Math.max(0, top), behavior });
}
