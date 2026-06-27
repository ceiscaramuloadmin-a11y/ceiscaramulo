import type { LayoutIconName, SiteLayoutSettings } from '@/types';
import { contactInfo } from '@/data/site';

export const SITE_LAYOUT_SETTINGS_KEY = 'site_layout_settings';
const PLACEHOLDER_FOOTER_COLUMN_TITLE = 'teste';
const FOOTER_LINKS_TO_REMOVE = new Set(['/sobre-nos', '/projetos', '/biblioteca', '/serra-do-caramulo', '/contactos']);
const FOOTER_MAIN_LINKS = [
  { label: 'Atividades', href: '/atividades' },
  { label: 'Notícias', href: '/noticias' },
];
const LOGO_GREEN = '#0f4c36';
const LEGACY_GREEN_VALUES = new Set(['#27441d', '#3e5c32', '#9dc44d']);

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
      institutionalTitle: 'Informações institucionais',
      presidentLabel: 'Presidente da Direção',
      presidentName: 'Prof. Luís Costa',
      phoneLabel: 'Telemóvel',
      phone: '966717360',
      emailLabel: 'Email',
      email: 'ceiscaramulo@gmail.com',
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
    artigosParaVenda: {
      title: 'Artigos para venda',
      description: 'Amostra de artigos, materiais e produtos associados ao CEISCaramulo e às iniciativas da Serra do Caramulo.',
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
  aboutPage: {
    whoWeAreTitle: 'Quem Somos',
    whoWeAreParagraphs: [
      'O CEISCaramulo é uma associação legalmente constituída, sem fins lucrativos, sediada na vila do Caramulo, no edifício do Turismo. A sua missão passa por promover o estudo e a investigação nos vários domínios ligados à Serra do Caramulo, desde o ambiente à geografia, da biologia à geologia, da história à etnografia e à gastronomia.',
      'Este trabalho é pensado com um olhar simultaneamente científico, cultural e económico, valorizando o património material e imaterial da região e promovendo o empreendedorismo local como parte de uma estratégia de desenvolvimento sustentável.',
      'Conhecer aquilo que distingue a Serra do Caramulo é, para o CEISCaramulo, a base para projetar o futuro e valorizar o que já existe.',
    ],
    originTitle: 'Como Nasceu',
    originParagraphs: [
      'A ideia de criar o Centro de Estudos e Interpretação da Serra do Caramulo nasceu no âmbito do projeto "Conhecer o que é nosso, para preservar e valorizar", apresentado pelo então Agrupamento de Escolas do Caramulo ao concurso promovido pela Fundação Montepio.',
      'Esse projeto recebeu o Prémio Escolar Montepio 2011, no valor de 25 mil euros, e foi esse impulso que ajudou a transformar a visão inicial numa associação ativa e enraizada no território.',
    ],
    foundersTitle: 'Fundadores',
    foundersParagraphs: [
      'O grupo fundador que concretizou a Associação CEISCaramulo reuniu pessoal docente e não docente, encarregados de educação da Escola EB 2,3 do Caramulo e do Agrupamento de Escolas de Tondela Tomaz Ribeiro, as freguesias do território da Serra do Caramulo representadas pelas respetivas juntas e ainda o vereador do pelouro da Cultura e Educação da Câmara Municipal de Tondela.',
    ],
    socialBodiesTitle: 'Corpos Sociais',
    socialBodies: [
      {
        title: 'Mesa da Assembleia Geral',
        members: [
          'Presidente: Maria Nazaré Gonçalves Gouveia',
          '1.º Secretário: Rosa Maria Pereira Loureiro Soares',
          '2.º Secretário: Maria Dolores da Veiga Gonçalves',
        ],
      },
      {
        title: 'Direção',
        members: [
          'Presidente: Luís Filipe Rodrigues da Costa',
          'Vice-Presidente: Fernanda Marques Ferreira Martins',
          '1.º Vogal: Maria Celeste Bastos Monteiro',
          '2.º Vogal: Rosa Maria Marques Coimbra Fernandes',
          '3.º Vogal: Pedro Luís Silva Pereira',
        ],
      },
      {
        title: 'Conselho Fiscal',
        members: [
          'Presidente: António Augusto Ferreira',
          '1.º Vogal: António Dias',
          '2.º Vogal: Fernanda Maria Amaral Rodrigues Pereira',
        ],
      },
    ],
    contactTitle: 'Contacte-nos',
    contactDescription: 'Tem questões ou quer saber mais sobre o nosso trabalho? Entre em contacto connosco.',
    contactAddressLabel: 'Morada',
    contactAddress: `${contactInfo.address}, ${contactInfo.postalCode} ${contactInfo.city}`,
    contactPhoneLabel: 'Telefone',
    contactPhone: contactInfo.phone,
    contactEmailLabel: 'Email',
    contactEmail: contactInfo.email,
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
        title: 'CEISCaramulo em ação',
        links: [
          { label: 'Atividades', href: '/atividades' },
          { label: 'Notícias', href: '/noticias' },
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
    membership: {
      title: 'Tornar-se sócio',
      description: '',
      ctaLabel: 'Preencher formulário',
      ctaHref: 'https://forms.gle/KQKtyjGUPhF5DNRJ8',
    },
    socialTitle: 'Redes Sociais',
    copyrightLine: '© CEISCaramulo - Organização sem fins lucrativos. Todos os direitos reservados.',
    legalLine: 'Associação sem fins lucrativos',
  },
  visualIdentity: {
    colors: {
      primary: '#0f4c36',
      secondary: '#176b4d',
      accent: '#5f9a7a',
      buttons: '#0f4c36',
      links: '#0f4c36',
      titles: '#0f4c36',
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
  const normalizedVisualColors = Object.fromEntries(
    Object.entries(settings.visualIdentity.colors).map(([key, value]) => [
      key,
      LEGACY_GREEN_VALUES.has(value.trim().toLowerCase()) ? LOGO_GREEN : value,
    ])
  ) as SiteLayoutSettings['visualIdentity']['colors'];

  return {
    ...settings,
    footer: {
      ...settings.footer,
      membership: settings.footer.membership ?? defaultSiteLayoutSettings.footer.membership,
      columns: settings.footer.columns
        .filter((column) => !column.title.toLowerCase().includes('restrita'))
        .map((column, index) => {
          const title =
            column.title.trim().toLowerCase() === PLACEHOLDER_FOOTER_COLUMN_TITLE
              ? defaultSiteLayoutSettings.footer.columns[index]?.title ?? column.title
              : column.title;

          return {
            ...column,
            title,
            links:
              index === 0 || title.trim().toLowerCase() === 'conhecer'
                ? FOOTER_MAIN_LINKS
                : column.links.filter((link) => !link.href.startsWith('/backoffice') && !FOOTER_LINKS_TO_REMOVE.has(link.href)),
          };
        }),
    },
    visualIdentity: {
      ...settings.visualIdentity,
      colors: normalizedVisualColors,
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
