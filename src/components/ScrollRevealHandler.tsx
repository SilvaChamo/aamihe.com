'use client';

import { useEffect } from 'react';

export default function ScrollRevealHandler() {
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active-reveal');
          // Opcional: parar de observar após revelar
          // observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1, // Começa a revelar quando 10% do elemento está visível
      rootMargin: '0px 0px -50px 0px' // Margem para disparar um pouco antes/depois
    });

    revealElements.forEach(el => observer.observe(el));

    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return null; // Este componente não renderiza nada, apenas executa a lógica
}
