'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/admin-auth';

export type SettingsState = Record<string, unknown>;

export function useSettings<T extends SettingsState>(defaults: T) {
  const [settings, setSettings] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    adminFetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings && Object.keys(data.settings).length > 0) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {
        // silent fail — defaults remain
      })
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(
    async (patch?: Partial<T>) => {
      setSaving(true);
      setError('');
      const toSave = patch ? { ...settings, ...patch } : settings;
      if (patch) setSettings((prev) => ({ ...prev, ...patch }));

      try {
        const res = await adminFetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSave),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Erro ao guardar definições.');
        } else {
          setSavedAt(new Date());
        }
      } catch {
        setError('Erro de ligação. Tente novamente.');
      } finally {
        setSaving(false);
      }
    },
    [settings],
  );

  return { settings, setSettings, loading, saving, savedAt, error, save };
}
