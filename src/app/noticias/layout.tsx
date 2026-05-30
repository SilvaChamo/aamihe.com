import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Blog – AAMIHE',
  description: 'Notícias e eventos da Associação Africana das Metodistas de Instituições de Ensino Superior.',
};

export default function NoticiasLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
