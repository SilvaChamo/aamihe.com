import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { NewsProvider } from '@/context/NewsContext';
import ScrollRevealHandler from '@/components/ScrollRevealHandler';
import localFont from 'next/font/local';

const robotoSlab = localFont({
  src: '../../public/Fonte/RobotoSlab-VariableFont_wght.ttf',
});

export const metadata: Metadata = {
  title: 'AAMIHE',
  description: 'Site oficial AAMIHE',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT" className={robotoSlab.className}>
      <body>
        <LanguageProvider>
          <NewsProvider>
            <ScrollRevealHandler />
            <div className="site-root">{children}</div>
          </NewsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
