'use client';

import { useLanguage } from '@/context/LanguageContext';
import './NewsletterSection.css';

const translations = {
  pt: {
    title: 'JUNTE-SE À EQUIPA',
    description: 'Faça parte da nossa comunidade inspiradora! Envie sua solicitação de adesão para se juntar-se à nossa equipa e contribuir para o fortalecimento da nossa jornada académica e espiritual',
    placeholderName: 'Seu nome',
    placeholderEmail: 'Seu email',
    placeholderContact: 'Seu contacto',
    btn: 'ENVIAR SOLICITAÇÃO',
  },
  en: {
    title: 'JOIN THE TEAM',
    description: 'Be part of our inspiring community! Send your membership request to join our team and contribute to strengthening our academic and spiritual journey. Fill in your details below to get started.',
    placeholderName: 'Your name',
    placeholderEmail: 'Your email',
    placeholderContact: 'Your contact',
    btn: 'SEND REQUEST',
  },
  fr: {
    title: 'REJOIGNEZ L\'ÉQUIPE',
    description: 'Faites partie de notre communauté inspirante ! Envoyez votre demande d\'adhésion para rejoindre notre équipe et contribuer au renforcement de notre parcours académique et spirituel. Remplissez vos coordonnées ci-dessous pour commencer.',
    placeholderName: 'Votre nom',
    placeholderEmail: 'Votre email',
    placeholderContact: 'Votre contact',
    btn: 'ENVOYER LA DEMANDE',
  }
};

export default function NewsletterSection() {
  const { locale } = useLanguage();
  const t = translations[locale];

  return (
    <section className="newsletter-section">
      <div className="newsletter-overlay"></div>
      <div className="newsletter-container">
        <h2 className="newsletter-title">{t.title}</h2>
        
        <p className="newsletter-description">
          {t.description}
        </p>

        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder={t.placeholderName} className="newsletter-input" />
          <input type="email" placeholder={t.placeholderEmail} className="newsletter-input" />
          <input type="tel" placeholder={t.placeholderContact} className="newsletter-input" />
          <button type="submit" className="newsletter-submit">{t.btn}</button>
        </form>
      </div>
    </section>
  );
}
