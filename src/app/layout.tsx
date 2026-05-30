import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
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
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.png'],
  },
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-JJJZM7P441';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT" className={robotoSlab.className}>
      <body>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
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
