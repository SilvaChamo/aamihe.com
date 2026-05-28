'use client';

import { type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import ContactForm from '@/components/ContactForm';
import FacebookPageEmbed from '@/components/FacebookPageEmbed';
import { useLanguage } from '@/context/LanguageContext';
import { useSitePageConfig } from '@/hooks/useSitePageConfig';
import styles from './contacte.module.css';

const COPY = {
  pt: {
    formTitle: 'Fale connosco',
    firstName: 'Nome',
    lastName: 'Apelido',
    contact: 'Contacto',
    email: 'Email',
    message: 'Mensagem',
    terms: 'Aceite os termos e referências',
    termsRequired: 'Obrigatório',
    mathLabel: 'Segurança',
    submit: 'ENVIAR',
    success: 'Mensagem enviada com sucesso. Obrigado pelo contacto.',
    error: 'Não foi possível enviar. Tente novamente.',
    search: 'PROCURAR',
    searchPlaceholder: 'Procurar…',
    facebook: 'FACEBOOK',
  },
  fr: {
    formTitle: 'Contactez-nous',
    firstName: 'Prénom',
    lastName: 'Nom',
    contact: 'Contact',
    email: 'Email',
    message: 'Message',
    terms: 'Acceptez les termes et références',
    termsRequired: 'Obligatoire',
    mathLabel: 'Sécurité',
    submit: 'ENVOYER',
    success: 'Message envoyé avec succès. Merci pour votre contact.',
    error: "Impossible d'envoyer. Réessayez.",
    search: 'RECHERCHER',
    searchPlaceholder: 'Rechercher…',
    facebook: 'FACEBOOK',
  },
  en: {
    formTitle: 'Contact us',
    firstName: 'First name',
    lastName: 'Last name',
    contact: 'Contact',
    email: 'Email',
    message: 'Message',
    terms: 'Accept the terms and references',
    termsRequired: 'Required',
    mathLabel: 'Security',
    submit: 'SEND',
    success: 'Message sent successfully. Thank you for contacting us.',
    error: 'Could not send. Please try again.',
    search: 'SEARCH',
    searchPlaceholder: 'Search…',
    facebook: 'FACEBOOK',
  },
} as const;

export default function ContacteNosPage() {
  const { locale } = useLanguage();
  const { pages } = useSitePageConfig();
  const router = useRouter();
  const t = COPY[locale];
  const { contact } = pages;

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

        <div className={`container clr ${styles['contact-layout']}`}>
          <div className={styles['contact-primary']}>
            <div className={styles['contact-form-section']}>
              <ContactForm labels={t} />
            </div>
            <div className={styles['contact-map']}>
              <iframe
                src={contact.mapEmbedUrl}
                title="Localização AAMIHE"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <aside className={styles['contact-sidebar']} aria-label="Pesquisa e redes sociais">
            <div className={styles['contact-sidebar-box']}>
              <h3>{t.search}</h3>
              <div className={styles['contact-sidebar-divider']} />
              <form className={styles['contact-search']} onSubmit={handleSiteSearch} role="search">
                <input
                  type="text"
                  name="company_url"
                  className={styles['contact-honeypot']}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <div className={styles['contact-search-row']}>
                  <input type="search" name="q" placeholder={t.searchPlaceholder} aria-label={t.search} />
                  <button type="submit" className={styles['contact-search-btn']} aria-label={t.search}>
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill="currentColor"
                        d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            <div className={`${styles['contact-sidebar-box']} ${styles['contact-sidebar-box--facebook']}`}>
              <h3>{t.facebook}</h3>
              <div className={styles['contact-sidebar-divider']} />
              <div className={styles['contact-facebook']}>
                <FacebookPageEmbed />
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
