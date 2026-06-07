import { adminFetch } from '@/lib/admin-auth';

type SettingsRecord = Record<string, unknown>;

const STORAGE_KEY = 'aamihe-admin-settings';

let cachedSettings: SettingsRecord | null = null;
let inflight: Promise<SettingsRecord | null> | null = null;
const listeners = new Set<() => void>();

function readStoredSettings(): SettingsRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as SettingsRecord;
  } catch {
    return null;
  }
}

function writeStoredSettings(settings: SettingsRecord | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (settings) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function subscribeSettingsCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function peekCachedSettings(): SettingsRecord | null {
  if (cachedSettings) return cachedSettings;
  const stored = readStoredSettings();
  if (stored) cachedSettings = stored;
  return cachedSettings;
}

export function seedSettingsCache(settings: SettingsRecord | null): void {
  cachedSettings = settings;
  writeStoredSettings(settings);
  listeners.forEach((listener) => listener());
}

export function invalidateSettingsCache(): void {
  cachedSettings = null;
  inflight = null;
  writeStoredSettings(null);
  listeners.forEach((listener) => listener());
}

export async function fetchSettingsCached(): Promise<SettingsRecord | null> {
  if (inflight) return inflight;

  inflight = adminFetch('/api/admin/settings', { cache: 'no-store' })
    .then((r) => r.json())
    .then((data) => {
      const settings =
        data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)
          ? (data.settings as SettingsRecord)
          : null;
      cachedSettings = settings;
      writeStoredSettings(settings);
      return settings;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
