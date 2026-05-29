import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sobre-nós – AAMIHE',
  description:
    'Conheça a AAMIHE — Associação Africana de Instituições Metodistas de Ensino Superior.',
};

export default function SobreNosLayout({ children }: { children: ReactNode }) {
  return children;
}
