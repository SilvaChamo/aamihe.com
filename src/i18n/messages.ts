import type { Locale } from '@/i18n/locale';

export const spamErrors = {
  pt: {
    honeypot: 'Verificação anti-robô falhou.',
    tooFast: 'Aguarde um momento e tente novamente.',
    mathWrong: 'Resposta de segurança incorrecta.',
    turnstileMissing: 'Complete a verificação de segurança.',
    turnstileFailed: 'Verificação de segurança falhou. Tente novamente.',
  },
  fr: {
    honeypot: 'La vérification anti-robot a échoué.',
    tooFast: 'Veuillez patienter un instant et réessayer.',
    mathWrong: 'Réponse de sécurité incorrecte.',
    turnstileMissing: 'Complétez la vérification de sécurité.',
    turnstileFailed: 'Échec de la vérification de sécurité. Réessayez.',
  },
  en: {
    honeypot: 'Anti-bot verification failed.',
    tooFast: 'Please wait a moment and try again.',
    mathWrong: 'Incorrect security answer.',
    turnstileMissing: 'Complete the security verification.',
    turnstileFailed: 'Security verification failed. Please try again.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export const contactFormErrors = {
  pt: {
    nameRequired: 'Preencha o nome e o apelido.',
    emailMessageRequired: 'Preencha o email e a mensagem.',
    termsRequired: 'Deve aceitar os termos para enviar.',
  },
  fr: {
    nameRequired: 'Remplissez le prénom et le nom.',
    emailMessageRequired: "Remplissez l'e-mail et le message.",
    termsRequired: 'Vous devez accepter les conditions pour envoyer.',
  },
  en: {
    nameRequired: 'Please fill in first and last name.',
    emailMessageRequired: 'Please fill in email and message.',
    termsRequired: 'You must accept the terms to submit.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export const conferenceApiErrors = {
  pt: {
    nameEmailRequired: 'Nome e e-mail são obrigatórios.',
    termsRequired: 'Deve aceitar os termos e condições.',
    selectFile: 'Seleccione pelo menos um documento.',
    maxFiles: (n: number) => `Máximo de ${n} ficheiros por envio.`,
    sendError: 'Erro ao enviar documento.',
    successOne: 'Documento enviado com sucesso. Será publicado após revisão.',
    successMany: (n: number) =>
      `${n} documentos enviados com sucesso. Serão publicados após revisão.`,
    emptyFile: 'Ficheiro vazio.',
    fileTooLarge: (name: string) => `«${name}» excede o limite de 15 MB.`,
    unsupportedFormat: (name: string) =>
      `Formato não suportado: «${name}». Use PDF, Word, Excel, PowerPoint ou formatos comuns.`,
  },
  fr: {
    nameEmailRequired: 'Le nom et l’e-mail sont obligatoires.',
    termsRequired: 'Vous devez accepter les termes et conditions.',
    selectFile: 'Sélectionnez au moins un document.',
    maxFiles: (n: number) => `Maximum de ${n} fichiers par envoi.`,
    sendError: "Erreur lors de l'envoi du document.",
    successOne: 'Document envoyé avec succès. Il sera publié après examen.',
    successMany: (n: number) =>
      `${n} documents envoyés avec succès. Ils seront publiés après examen.`,
    emptyFile: 'Fichier vide.',
    fileTooLarge: (name: string) => `«${name}» dépasse la limite de 15 Mo.`,
    unsupportedFormat: (name: string) =>
      `Format non pris en charge : «${name}». Utilisez PDF, Word, Excel, PowerPoint ou formats courants.`,
  },
  en: {
    nameEmailRequired: 'Name and email are required.',
    termsRequired: 'You must accept the terms and conditions.',
    selectFile: 'Select at least one document.',
    maxFiles: (n: number) => `Maximum of ${n} files per submission.`,
    sendError: 'Error sending document.',
    successOne: 'Document sent successfully. It will be published after review.',
    successMany: (n: number) =>
      `${n} documents sent successfully. They will be published after review.`,
    emptyFile: 'Empty file.',
    fileTooLarge: (name: string) => `«${name}» exceeds the 15 MB limit.`,
    unsupportedFormat: (name: string) =>
      `Unsupported format: «${name}». Use PDF, Word, Excel, PowerPoint or common formats.`,
  },
} as const;

export const galleryCopy = {
  pt: {
    pageTitle: 'GALERIA',
    loading: 'A carregar...',
    loadingGallery: 'A carregar galeria...',
    empty: 'Nenhum conteúdo encontrado para este filtro.',
    filterType: 'Filtrar por tipo',
    filterOrigin: 'Filtrar por origem',
    images: 'Imagens',
    documents: 'Documentos',
    videos: 'Vídeos',
    allTypes: 'Todos',
    allOrigins: 'Todas as origens',
    news: 'Notícias',
    gallery: 'Galeria',
    itemsCount: (visible: number, total: number) => `${visible} de ${total} itens`,
    searchPlaceholder: 'Pesquisar...',
    openDocument: 'Abrir documento',
    viewFile: 'Ver ficheiro',
    loadMore: (remaining: number) => `Carregar mais (${remaining} restantes)`,
    mathPlus: 'mais',
  },
  fr: {
    pageTitle: 'GALERIE',
    loading: 'Chargement...',
    loadingGallery: 'Chargement de la galerie...',
    empty: 'Aucun contenu trouvé pour ce filtre.',
    filterType: 'Filtrer par type',
    filterOrigin: 'Filtrer par origine',
    images: 'Images',
    documents: 'Documents',
    videos: 'Vidéos',
    allTypes: 'Tous',
    allOrigins: 'Toutes les origines',
    news: 'Actualités',
    gallery: 'Galerie',
    itemsCount: (visible: number, total: number) => `${visible} sur ${total} éléments`,
    searchPlaceholder: 'Rechercher...',
    openDocument: 'Ouvrir le document',
    viewFile: 'Voir le fichier',
    loadMore: (remaining: number) => `Charger plus (${remaining} restants)`,
    mathPlus: 'plus',
  },
  en: {
    pageTitle: 'GALLERY',
    loading: 'Loading...',
    loadingGallery: 'Loading gallery...',
    empty: 'No content found for this filter.',
    filterType: 'Filter by type',
    filterOrigin: 'Filter by origin',
    images: 'Images',
    documents: 'Documents',
    videos: 'Videos',
    allTypes: 'All',
    allOrigins: 'All sources',
    news: 'News',
    gallery: 'Gallery',
    itemsCount: (visible: number, total: number) => `${visible} of ${total} items`,
    searchPlaceholder: 'Search...',
    openDocument: 'Open document',
    viewFile: 'View file',
    loadMore: (remaining: number) => `Load more (${remaining} remaining)`,
    mathPlus: 'plus',
  },
} as const;

export const documentsListCopy = {
  pt: {
    loading: 'A carregar documentos...',
    empty: 'Nenhum documento disponível de momento.',
    downloadPdf: 'Descarregar PDF',
  },
  fr: {
    loading: 'Chargement des documents...',
    empty: 'Aucun document disponible pour le moment.',
    downloadPdf: 'Télécharger le PDF',
  },
  en: {
    loading: 'Loading documents...',
    empty: 'No documents available at the moment.',
    downloadPdf: 'Download PDF',
  },
} as const;

export const sobrePageCopy = {
  pt: {
    bannerTitle: 'SOBRE-NÓS',
    breadcrumb: 'Sobre-nós',
  },
  fr: {
    bannerTitle: 'À PROPOS',
    breadcrumb: 'À propos',
  },
  en: {
    bannerTitle: 'ABOUT US',
    breadcrumb: 'About us',
  },
} as const;

export const countriesCarouselCopy = {
  pt: {
    ariaLabel: 'Carrossel de países membros',
    prev: 'Anterior',
    next: 'Seguinte',
  },
  fr: {
    ariaLabel: 'Carrousel des pays membres',
    prev: 'Précédent',
    next: 'Suivant',
  },
  en: {
    ariaLabel: 'Member countries carousel',
    prev: 'Previous',
    next: 'Next',
  },
} as const;

export const heroBannerCopy = {
  pt: { ariaLabel: 'Boas-vindas' },
  fr: { ariaLabel: 'Bienvenue' },
  en: { ariaLabel: 'Welcome' },
} as const;

export const contactPageExtra = {
  pt: {
    mapTitle: 'Localização AAMIHE',
    sidebarAria: 'Pesquisa e redes sociais',
  },
  fr: {
    mapTitle: 'Localisation AAMIHE',
    sidebarAria: 'Recherche et réseaux sociaux',
  },
  en: {
    mapTitle: 'AAMIHE location',
    sidebarAria: 'Search and social media',
  },
} as const;

export const conferenceDocumentsPageCopy = {
  pt: { pageTitle: 'DOCUMENTOS DA CONFERÊNCIA' },
  fr: { pageTitle: 'DOCUMENTS DE LA CONFÉRENCE' },
  en: { pageTitle: 'CONFERENCE DOCUMENTS' },
} as const;

export const commonUiCopy = {
  pt: {
    breadcrumbNav: 'Caminho de navegação',
    pageFallback: 'Página',
    hidePassword: 'Ocultar senha',
    showPassword: 'Mostrar senha',
  },
  fr: {
    breadcrumbNav: "Fil d'Ariane",
    pageFallback: 'Page',
    hidePassword: 'Masquer le mot de passe',
    showPassword: 'Afficher le mot de passe',
  },
  en: {
    breadcrumbNav: 'Breadcrumb',
    pageFallback: 'Page',
    hidePassword: 'Hide password',
    showPassword: 'Show password',
  },
} as const;

export const conferenceFormExtra = {
  pt: {
    maxFilesHint: 'máx.',
    maxFilesError: (n: number) => `Seleccione no máximo ${n} ficheiros por envio.`,
    selectAtLeastOne: 'Seleccione pelo menos um documento.',
    filesSelected: (n: number) => `${n} ficheiro(s) seleccionado(s)`,
    removeFile: (name: string) => `Remover ${name}`,
    formatsPublic:
      'Formatos: PDF, Word (.doc, .docx), Excel (.xls, .xlsx, .csv), PowerPoint (.ppt, .pptx), OpenDocument (.odt, .ods, .odp), TXT, RTF — até 15 MB cada.',
    formatsAuth: 'Formatos: PDF, Word e PowerPoint até 10 MB cada.',
  },
  fr: {
    maxFilesHint: 'max.',
    maxFilesError: (n: number) => `Sélectionnez au maximum ${n} fichiers par envoi.`,
    selectAtLeastOne: 'Sélectionnez au moins un document.',
    filesSelected: (n: number) => `${n} fichier(s) sélectionné(s)`,
    removeFile: (name: string) => `Supprimer ${name}`,
    formatsPublic:
      'Formats : PDF, Word (.doc, .docx), Excel (.xls, .xlsx, .csv), PowerPoint (.ppt, .pptx), OpenDocument (.odt, .ods, .odp), TXT, RTF — jusqu’à 15 Mo chacun.',
    formatsAuth: 'Formats : PDF, Word et PowerPoint jusqu’à 10 Mo chacun.',
  },
  en: {
    maxFilesHint: 'max.',
    maxFilesError: (n: number) => `Select at most ${n} files per submission.`,
    selectAtLeastOne: 'Select at least one document.',
    filesSelected: (n: number) => `${n} file(s) selected`,
    removeFile: (name: string) => `Remove ${name}`,
    formatsPublic:
      'Formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx, .csv), PowerPoint (.ppt, .pptx), OpenDocument (.odt, .ods, .odp), TXT, RTF — up to 15 MB each.',
    formatsAuth: 'Formats: PDF, Word and PowerPoint up to 10 MB each.',
  },
} as const;

export function tMessages<T extends Record<Locale, unknown>>(map: T, locale: Locale): T[Locale] {
  return map[locale];
}
