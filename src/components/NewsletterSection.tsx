'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState, useRef } from 'react';
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
    description: 'Be part of our inspiring community! Send your membership request to join our team and contribute to strengthening our academic and spiritual journey.',
    placeholderName: 'Your name',
    placeholderEmail: 'Your email',
    placeholderContact: 'Your contact',
    btn: 'SEND REQUEST',
  },
  fr: {
    title: 'REJOIGNEZ L\'ÉQUIPE',
    description: 'Faites partie de notre comunidade inspirante ! Envoyez votre demande d\'adhésion pour rejoindre notre équipe et contribuer au renforcement de notre parcours académique et spirituel.',
    placeholderName: 'Votre nom',
    placeholderEmail: 'Votre email',
    placeholderContact: 'Votre contact',
    btn: 'ENVOYER LA DEMANDE',
  }
};

export default function NewsletterSection() {
  const { locale } = useLanguage();
  const t = translations[locale];
  const sectionRef = useRef<HTMLElement>(null);
  const [parallaxY, setParallaxY] = useState(0);

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
