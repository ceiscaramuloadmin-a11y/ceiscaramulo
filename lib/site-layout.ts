import type { LayoutIconName, SiteLayoutSettings } from '@/types';
import { contactInfo } from '@/data/site';

export const SITE_LAYOUT_SETTINGS_KEY = 'site_layout_settings';
const PLACEHOLDER_FOOTER_COLUMN_TITLE = 'teste';
const FOOTER_LINKS_TO_REMOVE = new Set(['/noticias', '/serra-do-caramulo', '/contactos']);

export const layoutIconOptions: LayoutIconName[] = [
  'Mountain',
  'TreePine',
  'Bird',
  'Pickaxe',
  'Users',
  'Calendar',
  'Newspaper',
  'FolderOpen',
  'BookOpen',
  'Camera',
  'Leaf',
  'MapPin',
];

export const defaultSiteLayoutSettings: SiteLayoutSettings = {
  home: {
    hero: {
      eyebrow: 'Associação sem fins lucrativos',
      titleLine1: 'Seis Caramulo',
      titleLine2: '',
      titleLine3: '',
      titleLine4: '',
      description: 'Centro de estudos e interpretação da Serra do Caramulo',
      primaryCtaLabel: 'Conhecer a Associação',
      primaryCtaHref: '/sobre-nos',
      secondaryCtaLabel: 'Ver Atividades',
      secondaryCtaHref: '/atividades',
      // Várias imagens: URLs separadas por "|" para o carrossel da Hero (ficheiros em /public).
      imageUrl: '/og-image.svg|/placeholder.svg',
      imageAlt: 'Vista panorâmica da Serra do Caramulo',
    },
    explore: {
      eyebrow: 'Explore',
      title: 'Descubra o CEISCaramulo',
      description: 'Uma associação dedicada à preservação e estudo do património único da Serra do Caramulo.',
      links: [
        { label: 'Sobre Nós', href: '/sobre-nos', title: 'Sobre Nós', description: 'Conheça a nossa missão e equipa', icon: 'Users' },
        { label: 'Atividades', href: '/atividades', title: 'Atividades', description: 'Caminhadas, workshops e eventos', icon: 'Calendar' },
        { label: 'Notícias', href: '/noticias', title: 'Notícias', description: 'Últimas novidades da associação', icon: 'Newspaper' },
        { label: 'Recursos', href: '/biblioteca', title: 'Recursos', description: 'Publicações e documentos públicos', icon: 'BookOpen' },
        { label: 'Galeria', href: '/galeria', title: 'Galeria', description: 'Fotografias e vídeos', icon: 'Camera' },
      ],
    },
    join: {
      title: 'Junte-se a nós',
      description: 'Faça parte de uma comunidade dedicada à preservação do património da Serra do Caramulo.',
      ctaLabel: 'Entrar em contacto',
      ctaHref: '/contactos',
    },
  },
  pages: {
    sobre: {
      title: 'Sobre Nós',
      description: 'Conheça a missão, história e equipa do CEISCaramulo.',
    },
    atividades: {
      title: 'Atividades',
      description: 'Caminhadas, workshops, palestras e eventos organizados pelo CEISCaramulo na Serra do Caramulo.',
      emptyMessage: 'Nenhuma atividade disponível no momento.',
    },
    noticias: {
      title: 'Notícias',
      description: 'Últimas novidades e notícias do CEISCaramulo sobre a Serra do Caramulo.',
      emptyMessage: 'Nenhuma notícia disponível no momento.',
    },
    projetos: {
      title: 'Projetos',
      description: 'Projetos de investigação, conservação e educação ambiental do CEISCaramulo na Serra do Caramulo.',
      emptyMessage: 'Nenhum projeto disponível no momento.',
    },
    biblioteca: {
      title: 'Recursos',
      description: 'Publicações, livros, artigos e documentos do CEISCaramulo sobre a Serra do Caramulo.',
      emptyMessage: 'Nenhuma publicação disponível no momento.',
    },
    serra: {
      title: 'A Serra do Caramulo',
      description: 'Descubra a geografia, flora, fauna e geologia deste território único no centro de Portugal.',
    },
    contactos: {
      title: 'Fale connosco.',
      description: 'Estamos disponíveis para esclarecer dúvidas, receber sugestões e acompanhar iniciativas ligadas ao CEISCaramulo.',
    },
    galeria: {
      title: 'Galeria Multimédia',
      description: 'Descobre fotografias, vídeos e áudios do património natural e cultural da Serra do Caramulo.',
    },
    bibliotecaJrs: {
      title: 'Biblioteca JRS',
      description: 'Espaço de consulta e valorização documental integrado no trabalho de estudo e interpretação da Serra do Caramulo.',
    },
    oficinaDoBurel: {
      title: 'Oficina do Burel',
      description: 'Espaço dedicado à valorização do burel, dos saberes tradicionais e das práticas ligadas à identidade da Serra do Caramulo.',
    },
    ponDoJueus: {
      title: 'PON do Jueus',
      description: 'Área de apresentação do PON do Jueus e das iniciativas associadas ao trabalho cultural e educativo do CEISCaramulo.',
    },
    escolaDosNossosAvos: {
      title: 'Escola dos Nossos Avós',
      description: 'Projeto dedicado à memória, à transmissão de saberes e à ligação entre gerações no território da Serra do Caramulo.',
    },
    oficinasDeFormacao: {
      title: 'Oficinas de formação',
      description: 'Informação sobre oficinas, ações formativas e momentos de aprendizagem promovidos pelo CEISCaramulo.',
    },
    publicacoes: {
      title: 'Publicações',
      description: 'Área dedicada às publicações, documentos e materiais produzidos ou divulgados pelo CEISCaramulo.',
    },
  },
  serra: {
    sections: [
      {
        id: 'geografia',
        title: 'Geografia',
        description:
          'A Serra do Caramulo situa-se entre os distritos de Viseu e Aveiro, atingindo os 1075 metros de altitude no ponto mais alto, o Caramulinho.',
        items: ['Altitude máxima: 1075m', 'Área: ~120 km²', 'Distritos: Viseu e Aveiro', 'Concelhos: Tondela, Vouzela, Águeda, Oliveira de Frades'],
        icon: 'Mountain',
      },
      {
        id: 'flora',
        title: 'Flora',
        description:
          'A Serra do Caramulo possui uma rica biodiversidade vegetal, desde carvalhos e castanheiros nas zonas mais baixas até urzes e tojo nas altitudes superiores.',
        items: ['Carvalho-roble (Quercus robur)', 'Castanheiro (Castanea sativa)', 'Urze (Erica sp.)', 'Azevinho (Ilex aquifolium)', 'Pinheiro-bravo (Pinus pinaster)'],
        icon: 'TreePine',
      },
      {
        id: 'fauna',
        title: 'Fauna',
        description:
          'A fauna da Serra do Caramulo inclui diversas espécies de aves de rapina, mamíferos e anfíbios de elevado valor conservacionista.',
        items: ['Águia-de-asa-redonda', 'Raposa-vermelha', 'Salamandra-lusitânica', 'Geneta', 'Bufo-real'],
        icon: 'Bird',
      },
      {
        id: 'geologia',
        title: 'Geologia',
        description:
          'O maciço do Caramulo é constituído predominantemente por granitos e xistos, com formações rochosas que datam do período Pré-Câmbrico.',
        items: ['Granitos hercínicos', 'Xistos do Pré-Câmbrico', 'Filões de quartzo', 'Minas de estanho e volfrâmio'],
        icon: 'Pickaxe',
      },
    ],
    aboutTitle: 'Sobre a Serra',
    aboutParagraph1:
      'A Serra do Caramulo é uma cadeia montanhosa localizada entre os distritos de Viseu e Aveiro, no centro de Portugal. Com uma altitude máxima de 1075 metros no Caramulinho, esta serra oferece uma paisagem diversificada e uma rica biodiversidade.',
    aboutParagraph2:
      'O território é caracterizado por uma mistura de florestas autóctones, pastagens e formações rochosas graníticas, proporcionando habitats únicos para diversas espécies de flora e fauna. A região tem sido historicamente importante para a conservação da natureza e a investigação científica.',
  },
  footer: {
    brandDescription: '',
    contactInfo: {
      address: contactInfo.address,
      postalCode: contactInfo.postalCode,
      city: contactInfo.city,
      phone: contactInfo.phone,
      email: contactInfo.email,
      socialMedia: {
        facebook: contactInfo.socialMedia.facebook,
        instagram: contactInfo.socialMedia.instagram,
        linkedin: contactInfo.socialMedia.linkedin,
        youtube: contactInfo.socialMedia.youtube,
      },
    },
    columns: [
      {
        title: 'Conhecer',
        links: [
          { label: 'Sobre Nós', href: '/sobre-nos' },
          { label: 'Atividades', href: '/atividades' },
          { label: 'Recursos', href: '/biblioteca' },
        ],
      },
      {
        title: 'Iniciativas',
        links: [
          { label: 'Galeria Multimédia', href: '/galeria' },
          { label: 'Oficina do Burel', href: '/oficina-do-burel' },
          { label: 'Escola dos Nossos Avós', href: '/escola-dos-nossos-avos' },
          { label: 'PON do Jueus', href: '/pon-do-jueus' },
        ],
      },
    ],
    socialTitle: 'Redes Sociais',
    copyrightLine: '© CEISCaramulo - Organização sem fins lucrativos. Todos os direitos reservados.',
    legalLine: 'Associação sem fins lucrativos',
  },
  visualIdentity: {
    colors: {
      primary: '#27441d',
      secondary: '#3e5c32',
      accent: '#6f8f3a',
      buttons: '#27441d',
      links: '#3e5c32',
      titles: '#27441d',
    },
    logos: {
      primary: '/ceiscaramulo-logo.svg',
      footer: '/ceiscaramulo-logo.svg',
      institutional: '',
    },
  },
  seo: {
    title: 'CEISCaramulo — Centro de Estudos e Interpretação da Serra do Caramulo',
    description: 'Associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.',
    keywords: 'CEISCaramulo, Serra do Caramulo, património natural, património cultural',
    ogImage: '/og-image.svg',
  },
};

export function normalizeSiteLayoutSettings(settings: SiteLayoutSettings): SiteLayoutSettings {
  return {
    ...settings,
    footer: {
      ...settings.footer,
      columns: settings.footer.columns.map((column, index) => ({
        ...column,
        title:
          column.title.trim().toLowerCase() === PLACEHOLDER_FOOTER_COLUMN_TITLE
            ? defaultSiteLayoutSettings.footer.columns[index]?.title ?? column.title
            : column.title,
        links: column.links.filter((link) => !FOOTER_LINKS_TO_REMOVE.has(link.href)),
      })),
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMergeSettings<T>(base: T, override: unknown): T {
  if (!isObject(base) || !isObject(override)) {
    return (override ?? base) as T;
  }

  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = result[key];

    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    if (isObject(current) && isObject(value)) {
      result[key] = deepMergeSettings(current, value);
      continue;
    }

    result[key] = value;
  }

  return result as T;
}
