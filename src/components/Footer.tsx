'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import FormAntiSpam from '@/components/FormAntiSpam';
import { validateSpamFromForm } from '@/lib/form-spam-guard';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteGeneralConfig } from '@/hooks/useSiteGeneralConfig';
import { DEFAULT_LOGO_URL } from '@/lib/site-general-config';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import './Footer.css';

const translations = {
  pt: {
    desc: 'A AAIMES é uma associação de instituições de ensino superior da Igreja Metodista Unida ou relacionadas, unanimemente criada numa conferência das instituições de ensino superior da Igreja Metodista Unida em África, em Setembro de 2014.',
    linksTitle: 'Links Diretos',
    links: [
      { name: 'Direcção', href: '/#direcao' },
      { name: 'Galeria de fotos', href: '/galeria' },
      { name: 'Documentos', href: '/galeria?tipo=documentos' },
      { name: 'Eventos', href: '/noticias' },
      { name: 'Países Membros', href: '/paises' },
      { name: 'Universidades filiais', href: '/universidades' },
      { name: 'Arquivo', href: '/arquivo' },
    ],
    visitTitle: 'Visite-nos',
    visitDesc: 'Pode encontrar nossos escritórios em todos os países associados, em Moçambique estamos:',
    address: 'Pestana Rovuma Hotel, Maputo',
    newsletterTitle: 'Newsletter',
    newsletterDesc: 'Registe-se para receber as nossas news letter',
    placeholderEmail: 'Seu endereço electrónico',
    btnGo: 'REGISTAR',
    gdpr: 'Aceite termos e condições',
    mathLabel: 'Segurança',
    followTitle: 'Segue-nos',
    rights: 'Todos os direitos reservados.'
  },
  en: {
    desc: 'AAMIHE is an association of higher education institutions of the United Methodist Church or related, unanimously created at a conference of the higher education institutions of the United Methodist Church in Africa, in September 2014.',
    linksTitle: 'Quick Links',
    links: [
      { name: 'Direction', href: '/#direcao' },
      { name: 'Photo Gallery', href: '/galeria' },
      { name: 'Documents', href: '/galeria?tipo=documentos' },
      { name: 'Events', href: '/noticias' },
      { name: 'Member Countries', href: '/paises' },
      { name: 'Affiliated Universities', href: '/universidades' },
      { name: 'Archive', href: '/arquivo' },
    ],
    visitTitle: 'Visit Us',
    visitDesc: 'You can find our offices in all associated countries, in Mozambique we are at:',
    address: 'Pestana Rovuma Hotel, Maputo',
    newsletterTitle: 'Newsletter',
    newsletterDesc: 'Register to receive our newsletters',
    placeholderEmail: 'Your email address',
    btnGo: 'Go',
    gdpr: 'Accept terms and conditions',
    mathLabel: 'Security',
    followTitle: 'Follow Us',
    rights: 'All rights reserved.'
  },
  fr: {
    desc: 'L\'AAMIHE est une association d\'institutions d\'enseignement supérieur de l\'Église Méthodiste Unie ou apparentées, créée à l\'unanimité lors d\'une conférence des institutions d\'enseignement supérieur de l\'Église Méthodiste Unie en Afrique, en septembre 2014.',
    linksTitle: 'Links Directs',
    links: [
      { name: 'Direction', href: '/#direcao' },
      { name: 'Galerie de photos', href: '/galeria' },
      { name: 'Documents', href: '/galeria?tipo=documentos' },
      { name: 'Événements', href: '/noticias' },
      { name: 'Pays Membres', href: '/paises' },
      { name: 'Universités Affiliées', href: '/universidades' },
      { name: 'Archives', href: '/arquivo' },
    ],
    visitTitle: 'Visitez-nous',
    visitDesc: 'Vous pouvez trouver nos bureaux dans tous les pays associés, au Mozambique nous sommes à :',
    address: 'Pestana Rovuma Hotel, Maputo',
    newsletterTitle: 'Newsletter',
    newsletterDesc: 'Inscrivez-vous para receber nos newsletters',
    placeholderEmail: 'Votre adresse e-mail',
    btnGo: 'Aller',
    gdpr: 'Accepter les termes et conditions',
    mathLabel: 'Sécurité',
    followTitle: 'Suivez-nous',
    rights: 'Tous droits réservés.'
  }
};

export type FooterSupportContact = {
  prefix: string;
  name: string;
  emailIntro: string;
  email: string;
};

export default function Footer({ supportContact }: { supportContact?: FooterSupportContact }) {
  const { locale } = useLanguage();
  const t = translations[locale];
  const { general } = useSiteGeneralConfig();
  const logoSrc = resolveAvatarUrl(general.logoUrl) || DEFAULT_LOGO_URL;
  const footerLinks = general.footerLinks.filter((link) => link.name.trim() && link.href.trim());
  const displayLinks = footerLinks.length ? footerLinks : t.links;
  const [newsletterKey, setNewsletterKey] = useState(0);

  function handleNewsletterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const spam = validateSpamFromForm(e.currentTarget);
    if (!spam.ok) {
      return;
    }
    setNewsletterKey((k) => k + 1);
  }

  return (
    <footer className="footer" id="footer">
        <div className="container footer-container">
          {/* Column 1 */}
          <div className="footer-col col-1">
            <div className="footer-logo">
              <Image
                src={logoSrc}
                alt={`${general.siteName} Logo`}
                width={263}
                height={72}
                className="footer-logo-image"
                unoptimized={logoSrc.startsWith('http')}
              />
            </div>
            <p className="footer-desc">
              {t.desc}
            </p>
            <div className="footer-social footer-social--intro">
              <ul className="oceanwp-social-icons">
                {general.socialLinks.twitter ? (
                  <li className="oceanwp-twitter">
                    <a href={general.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="X">
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path></svg>
                    </a>
                  </li>
                ) : null}
                {general.socialLinks.facebook ? (
                  <li className="oceanwp-facebook">
                    <a href={general.socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>
                    </a>
                  </li>
                ) : null}
                {general.socialLinks.instagram ? (
                  <li className="oceanwp-instagram">
                    <a href={general.socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.8 9.9 67.6 36.1 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>
                    </a>
                  </li>
                ) : null}
                {general.socialLinks.linkedin ? (
                  <li className="oceanwp-linkedin">
                    <a href={general.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M100.28 448H7.4V148.9h92.88zm-46.44-340.77c-29.7 0-53.82-24.12-53.82-53.82S24.13 0 53.83 0s53.82 24.12 53.82 53.82-24.12 53.82-53.82 53.82zM448 448h-92.88V302.4c0-34.74-.62-79.44-48.41-79.44-48.46 0-55.88 37.86-55.88 76.94V448h-92.88V148.9h89.12v40.84h1.28c12.4-23.47 42.68-48.2 87.78-48.2 93.9 0 111.18 61.81 111.18 142.14z"></path></svg>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
          
          {/* Column 2 */}
          <div className="footer-col col-2">
            <h4 className="footer-title">{t.linksTitle}</h4>
            <ul className="footer-links">
              {displayLinks.map((link, idx) => (
                <li key={idx}><Link href={link.href}>{link.name}</Link></li>
              ))}
            </ul>
          </div>
          
          {/* Column 3 */}
          <div className="footer-col col-3">
            <h4 className="footer-title">{t.visitTitle}</h4>
            <ul className="footer-contact">
              <li className="text">{t.visitDesc}</li>
              <li className="address">
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path></svg>
                <div className="oceanwp-info-wrap">
                  <span className="oceanwp-contact-title">Address:</span>
                  <span className="oceanwp-contact-text">{general.address || t.address}</span>
                </div>
              </li>
              <li className="phone">
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"></path></svg>
                <div className="oceanwp-info-wrap">
                  <span className="oceanwp-contact-title">Phone:</span>
                  <span className="oceanwp-contact-text">{general.contactPhone}</span>
                </div>
              </li>
              <li className="email">
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path></svg>
                <div className="oceanwp-info-wrap">
                  <span className="oceanwp-contact-title">Email:</span>
                  <span className="oceanwp-contact-text"><a href={`mailto:${general.contactEmail}`}>{general.contactEmail}</a></span>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Column 4 */}
          <div className="footer-col col-4">
            <h4 className="footer-title">{t.newsletterTitle}</h4>
            <div className="oceanwp-newsletter-form">
              <div className="oceanwp-mail-text">{t.newsletterDesc}</div>
              <form key={newsletterKey} className="newsletter-form" onSubmit={handleNewsletterSubmit} noValidate>
                <div className="email-wrap">
                  <input
                    type="email"
                    name="email"
                    placeholder={t.placeholderEmail}
                    aria-label={t.placeholderEmail}
                    required
                  />
                </div>
                <button type="submit" className="button btn newsletter-submit-btn">
                  {t.btnGo}
                </button>
                <div className="gdpr-wrap">
                  <label>
                    <input type="checkbox" name="GDPR" value="1" required />
                    {t.gdpr}
                  </label>
                </div>
                <div className="footer-newsletter-security">
                  <FormAntiSpam mathLabel={t.mathLabel} mathClassName="footer-math-captcha" />
                </div>
              </form>
            </div>
          </div>
        </div>

        {supportContact ? (
          <div className="footer-support">
            <div className="container">
              <p>
                {supportContact.prefix}{' '}
                {supportContact.name} {supportContact.emailIntro}{' '}
                <a href={`mailto:${supportContact.email}`}>{supportContact.email}</a>
                {' | '}
                <a href="mailto:geral@aamihe.com">geral@aamihe.com</a>
              </p>
            </div>
          </div>
        ) : null}

        <div className="footer-bottom">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} AAMIHE. {t.rights}</p>
          </div>
        </div>
      </footer>
  );
}
