import type { LayoutIconName, SiteLayoutSettings } from '@/types';

export const SITE_LAYOUT_SETTINGS_KEY = 'site_layout_settings';

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
      description: 'Preservar, estudar e divulgar o património natural, cultural e histórico da Serra do Caramulo.',
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
        { label: 'Conteúdos e Recursos', href: '/biblioteca', title: 'Conteúdos e Recursos', description: 'Biblioteca e documentos públicos', icon: 'BookOpen' },
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
      title: 'Biblioteca',
      description: 'Publicações, livros, artigos e documentos do CEISCaramulo sobre a Serra do Caramulo.',
      emptyMessage: 'Nenhuma publicação disponível no momento.',
    },
    serra: {
      title: 'A Serra do Caramulo',
      description: 'Descubra a geografia, flora, fauna e geologia deste território único no centro de Portugal.',
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
    brandDescription: 'Promovendo o estudo, a preservação e a valorização do património natural e cultural da Serra do Caramulo.',
    columns: [
      {
        title: 'Institucional',
        links: [
          { label: 'Sobre Nós', href: '/sobre-nos' },
          { label: 'Atividades', href: '/atividades' },
          { label: 'Notícias', href: '/noticias' },
          { label: 'Conteúdos e Recursos', href: '/biblioteca' },
        ],
      },
      {
        title: 'Explorar',
        links: [
          { label: 'Galeria Multimédia', href: '/galeria' },
          { label: 'A Serra do Caramulo', href: '/serra-do-caramulo' },
          { label: 'Contactos', href: '/contactos' },
        ],
      },
      {
        title: 'Área Restrita',
        links: [
          { label: 'Backoffice', href: '/backoffice' },
          { label: 'Login Administrativo', href: '/backoffice/login' },
        ],
      },
    ],
    socialTitle: 'Redes Sociais',
    copyrightLine: '© CEISCaramulo - Organização sem fins lucrativos. Todos os direitos reservados.',
    legalLine: 'Associação sem fins lucrativos',
  },
};

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
