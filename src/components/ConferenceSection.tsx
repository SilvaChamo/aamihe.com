'use client';

import { useLanguage } from '@/context/LanguageContext';
import './ConferenceSection.css';

const translations = {
  pt: {
    subtitle: 'CONFERÊNCIA PAN-AFRICANA',
    title: 'A Conferência',
    text: 'Junte-se a líderes educacionais, pesquisadores e instituições metodistas de ensino superior em nossa conferência sobre “Parcerias Colaborativas Pan-Africanas para o Desenvolvimento Sustentável das Instituições de Ensino Superior”.',
    date_label: 'A ter lugar no dia:',
    date: '13 a 15 de outubro de 2025',
    location: 'Hotel Birchwood, Joanesburgo, África do Sul',
    btn: 'Saiba Mais',
  },
  fr: {
    subtitle: 'CONFÉRENCE PANAFRICAINE',
    title: 'La Conférence',
    text: 'Rejoignez les leaders éducatifs, les chercheurs et les institutions méthodistes d\'enseignement supérieur lors de notre conférence sur « Les partenariats collaboratifs panafricains pour le développement durable des institutions d\'enseignement supérieur ».',
    date_label: 'Aura lieu le:',
    date: '13 au 15 octobre 2025',
    location: 'Hôtel Birchwood, Johannesburg, Afrique du Sud',
    btn: 'En savoir plus',
  },
  en: {
    subtitle: 'PAN-AFRICAN CONFERENCE',
    title: 'The Conference',
    text: 'Join educational leaders, researchers, and Methodist higher education institutions at our conference on “Pan-African Collaborative Partnerships for the Sustainable Development of Higher Education Institutions”.',
    date_label: 'Taking place on:',
    date: 'October 13 to 15, 2025',
    location: 'Birchwood Hotel, Johannesburg, South Africa',
    btn: 'Read More',
  },
};

export default function ConferenceSection() {
  const { locale } = useLanguage();
  const t = translations[locale];

  return (
    <section className="conference-section" id="conferencia">
      <div className="conference-overlay"></div>
      <div className="conference-container">
        <div className="conference-content">
          <span className="conference-subtitle">{t.subtitle}</span>
          <h2 className="conference-title">{t.title}</h2>
          <p className="conference-text">{t.text}</p>
          
          {/* Caixa com fundo preto transparente para data, local e botão */}
          <div className="conference-box">
            <div className="conference-details">
              <p className="conference-date-label">{t.date_label}</p>
              <p className="conference-date">{t.date}</p>
              <p className="conference-location">{t.location}</p>
            </div>

            <div className="conference-actions">
              <a href="/conferencia" className="conference-btn">
                {t.btn}
              </a>
            </div>

            {/* Linha de destaque no fundo */}
            <div className="conference-box-accent"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
