const BUILTIN_PLATFORM_ADMIN_EMAILS = ['silva.chamo@gmail.com'];

export function isPlatformAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (BUILTIN_PLATFORM_ADMIN_EMAILS.includes(normalized)) return true;
  const extra = (process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(normalized);
}
