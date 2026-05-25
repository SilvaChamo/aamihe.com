export function dispatchMediaUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mediaUpdated'));
  }
}
