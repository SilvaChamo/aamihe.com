import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contacte-nos – AAMIHE',
  description: 'Entre em contacto com a AAMIHE.',
};

export default function ContacteNosLayout({ children }: { children: ReactNode }) {
  return children;
}
