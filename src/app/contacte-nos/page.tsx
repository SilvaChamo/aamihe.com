'use client';

import { useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import ContactForm from '@/components/ContactForm';
import { useLanguage } from '@/context/LanguageContext';
import { useSitePageConfig } from '@/hooks/useSitePageConfig';
import { scrollBelowSiteHeader } from '@/lib/scroll-page-top';
import styles from './contacte.module.css';

const COPY = {
  pt: {
    name: 'Nome',
    email: 'Email',
    message: 'Mensagem',
    terms: 'Aceite os termos e referências',
    termsRequired: 'Obrigatório',
    submit: 'ENVIAR',
    success: 'Mensagem enviada com sucesso. Obrigado pelo contacto.',
    error: 'Não foi possível enviar. Tente novamente.',
    search: 'PROCURAR',
    searchPlaceholder: 'Procurar…',
    infoTitle: 'Contactos',
    facebook: 'Facebook',
    facebookNote: 'Siga a AAMIHE nas redes sociais.',
  },
  fr: {
    name: 'Nom',
    email: 'Email',
    message: 'Message',
    terms: 'Acceptez les termes et références',
    termsRequired: 'Obligatoire',
    submit: 'ENVOYER',
    success: 'Message envoyé avec succès. Merci pour votre contact.',
    error: "Impossible d'envoyer. Réessayez.",
    search: 'RECHERCHER',
    searchPlaceholder: 'Rechercher…',
    infoTitle: 'Contacts',
    facebook: 'Facebook',
    facebookNote: 'Suivez AAMIHE sur les réseaux sociaux.',
  },
  en: {
    name: 'Name',
    email: 'Email',
    message: 'Message',
    terms: 'Accept the terms and references',
    termsRequired: 'Required',
    submit: 'SEND',
    success: 'Message sent successfully. Thank you for contacting us.',
    error: 'Could not send. Please try again.',
    search: 'SEARCH',
    searchPlaceholder: 'Search…',
    infoTitle: 'Contact',
    facebook: 'Facebook',
    facebookNote: 'Follow AAMIHE on social media.',
  },
} as const;

export default function ContacteNosPage() {
  const { locale } = useLanguage();
  const { pages } = useSitePageConfig();
  const router = useRouter();
  const t = COPY[locale];
  const { contact } = pages;

  useEffect(() => {
    scrollBelowSiteHeader('contact-content-start', 'auto');
  }, []);

  function handleSiteSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q');
    const query = typeof q === 'string' ? q.trim() : '';
    if (query) {
      router.push(`/noticias?search=${encodeURIComponent(query)}`);
    } else {
      router.push('/noticias');
    }
  }

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${styles['contact-main']}`} role="main">
        <BlogPageBanner title={contact.bannerTitle} imageUrl={contact.bannerImage} />
        <div id="contact-content-start" className={styles['contact-content-anchor']} aria-hidden="true" />

        <div className={`container clr ${styles['contact-layout']}`}>
          <div className={styles['contact-primary']}>
            <div className={styles['contact-map']}>
              <iframe
                src={contact.mapEmbedUrl}
                title="Localização AAMIHE"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <ContactForm labels={t} />
          </div>

          <aside className={styles['contact-sidebar']} aria-label="Informação de contacto">
            <div className={styles['contact-sidebar-box']}>
              <h3>{t.infoTitle}</h3>
              <div className={styles['contact-sidebar-divider']} />
              <ul className={styles['contact-info-list']}>
                <li>{contact.address}</li>
                <li>
                  <a href={`tel:${contact.contactPhone.replace(/\s/g, '')}`}>{contact.contactPhone}</a>
                </li>
                <li>
                  <a href={`mailto:${contact.contactEmail}`}>{contact.contactEmail}</a>
                </li>
              </ul>
            </div>

            <div className={styles['contact-sidebar-box']}>
              <h3>{t.search}</h3>
              <div className={styles['contact-sidebar-divider']} />
              <form className={styles['contact-search']} onSubmit={handleSiteSearch} role="search">
                <input type="search" name="q" placeholder={t.searchPlaceholder} aria-label={t.search} />
              </form>
            </div>

            <div className={styles['contact-sidebar-box']}>
              <h3>{t.facebook}</h3>
              <div className={styles['contact-sidebar-divider']} />
              <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{t.facebookNote}</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
