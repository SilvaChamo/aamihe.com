'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import FormAntiSpam from '@/components/FormAntiSpam';
import { validateSpamFromForm } from '@/lib/form-spam-guard';
import './NewsletterSection.css';

const translations = {
  pt: {
    title: 'JUNTE-SE À EQUIPA',
    description: 'Faça parte da nossa comunidade inspiradora! Envie sua solicitação de adesão para se juntar-se à nossa equipa e contribuir para o fortalecimento da nossa jornada académica e espiritual',
    placeholderName: 'Seu nome',
    placeholderEmail: 'Seu email',
    placeholderContact: 'Seu contacto',
    btn: 'ENVIAR SOLICITAÇÃO',
    mathLabel: 'Segurança',
    spamError: 'Verificação de segurança incorrecta.',
  },
  en: {
    title: 'JOIN THE TEAM',
    description: 'Be part of our inspiring community! Send your membership request to join our team and contribute to strengthening our academic and spiritual journey.',
    placeholderName: 'Your name',
    placeholderEmail: 'Your email',
    placeholderContact: 'Your contact',
    btn: 'SEND REQUEST',
    mathLabel: 'Security',
    spamError: 'Security verification failed.',
  },
  fr: {
    title: 'REJOIGNEZ L\'ÉQUIPE',
    description: 'Faites partie de notre comunidade inspirante ! Envoyez votre demande d\'adhésion pour rejoindre notre équipe et contribuer au renforcement de notre parcours académique et spirituel.',
    placeholderName: 'Votre nom',
    placeholderEmail: 'Votre email',
    placeholderContact: 'Votre contact',
    btn: 'ENVOYER LA DEMANDE',
    mathLabel: 'Sécurité',
    spamError: 'Échec de la vérification de sécurité.',
  }
};

export default function NewsletterSection() {
  const { locale } = useLanguage();
  const t = translations[locale];
  const sectionRef = useRef<HTMLElement>(null);
  const [parallaxY, setParallaxY] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [spamError, setSpamError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const spam = validateSpamFromForm(e.currentTarget);
    if (!spam.ok) {
      setSpamError(spam.error);
      return;
    }
    setSpamError('');
    setFormKey((k) => k + 1);
  }

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const scrollPosition = window.innerHeight - rect.top;
        if (scrollPosition > 0) {
          // Calcula o movimento relativo à entrada da secção no ecrã
          setParallaxY(scrollPosition * 0.15);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Inicializa a posição
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="newsletter-section" ref={sectionRef}>
      {/* Camada de Fundo com Parallax Seguro */}
      <div 
        className="newsletter-parallax-bg" 
        style={{ transform: `translateY(${parallaxY - 100}px)` }} // Offset inicial para cobrir tudo
      ></div>
      <div className="newsletter-overlay"></div>
      
      <div className="newsletter-container">
        <h2 className="newsletter-title">{t.title}</h2>
        
        <p className="newsletter-description">
          {t.description}
        </p>

        <form key={formKey} className="newsletter-form" onSubmit={handleSubmit} noValidate>
          <input type="text" placeholder={t.placeholderName} className="newsletter-input" required />
          <input type="email" placeholder={t.placeholderEmail} className="newsletter-input" required />
          <input type="tel" placeholder={t.placeholderContact} className="newsletter-input" />
          <button type="submit" className="newsletter-submit">{t.btn}</button>
          <div className="newsletter-form-security">
            <FormAntiSpam mathLabel={t.mathLabel} mathClassName="newsletter-math-captcha" />
          </div>
          {spamError ? <p className="newsletter-spam-error">{spamError}</p> : null}
        </form>
      </div>
    </section>
  );
}
