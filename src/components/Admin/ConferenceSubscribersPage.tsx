'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminBase } from '@/lib/admin-base';
import { Mail, User } from 'lucide-react';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import './admin-wp.css';

type ConferenceDocument = {
  id: string;
  author?: string;
  email?: string;
  created_at: string;
};

type Subscriber = {
  email: string;
  name: string;
  submissions: number;
  lastSubmission: string;
};

export default function ConferenceSubscribersPage() {
  const base = useAdminBase();
  const [documents, setDocuments] = useState<ConferenceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/documents?category=conferencia');
        const data = await res.json();
        if (!cancelled) setDocuments(Array.isArray(data?.documents) ? data.documents : []);
      } catch {
        if (!cancelled) setDocuments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribers = useMemo<Subscriber[]>(() => {
    const map = new Map<string, Subscriber>();
    for (const doc of documents) {
      const email = (doc.email || '').trim().toLowerCase();
      if (!email) continue;
      const existing = map.get(email);
      if (!existing) {
        map.set(email, {
          email,
          name: doc.author?.trim() || 'Subscritor',
          submissions: 1,
          lastSubmission: doc.created_at,
        });
        continue;
      }
      existing.submissions += 1;
      if (new Date(doc.created_at).getTime() > new Date(existing.lastSubmission).getTime()) {
        existing.lastSubmission = doc.created_at;
      }
      if (!existing.name || existing.name === 'Subscritor') {
        existing.name = doc.author?.trim() || existing.name;
      }
      map.set(email, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.submissions - a.submissions);
  }, [documents]);

  const filteredSubscribers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (sub) => sub.email.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q),
    );
  }, [subscribers, searchQuery]);

  return (
    <div className="wp-admin-page">
      <div className="wp-page-header">
        <h1>Subscritores da Conferência</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <Link href={`${base}/enviar-email`} className="wp-btn wp-btn-primary">
            <Mail size={14} />
            Enviar e-mail a todos
          </Link>
          <Link href={`${base}/documentos-gerais`} className="wp-btn wp-btn-outline">
            Ver submissões
          </Link>
        </div>
      </div>

      <div className="wp-list-toolbar">
        <div className="wp-list-toolbar-right">
          <div className="wp-search-group">
            <input
              type="search"
              className="wp-input"
              placeholder="Pesquisar subscritores"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="button" className="wp-btn">
              Pesquisar subscritores
            </button>
          </div>
        </div>
      </div>

      <div className="wp-list-table-wrap">
        <table className="wp-list-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th style={{ textAlign: 'center' }}>Submissões</th>
              <th>Última submissão</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={4} />)
            ) : filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="wp-empty">
                  Sem subscritores registados por enquanto.
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((sub) => (
                <tr key={sub.email}>
                  <td>
                    <User size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                    {sub.name}
                  </td>
                  <td>
                    <Mail size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                    {sub.email}
                  </td>
                  <td style={{ textAlign: 'center' }}>{sub.submissions}</td>
                  <td>{new Date(sub.lastSubmission).toLocaleString('pt-PT')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <p className="wp-list-footer">
          {filteredSubscribers.length} {filteredSubscribers.length === 1 ? 'item' : 'itens'}
        </p>
      )}
    </div>
  );
}
