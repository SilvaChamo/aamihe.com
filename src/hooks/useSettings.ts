'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminSecret } from '@/lib/admin-auth';

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

    const token = getAdminSecret();
    fetch('/api/admin/settings', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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
        const token = getAdminSecret();
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
    [settings]
  );

  return { settings, setSettings, loading, saving, savedAt, error, save };
}
