// Next.js: Static data — can be imported in server components or used with getStaticProps
import type { Activity, NewsArticle, Project, Publication, GalleryItem, TeamMember, SerraInfo } from '../types';

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Dr. António Silva',
    role: 'Presidente',
    bio: 'Investigador em ecologia e biodiversidade com mais de 20 anos de experiência na Serra do Caramulo.',
  },
  {
    id: '2',
    name: 'Dra. Maria Fernandes',
    role: 'Vice-Presidente',
    bio: 'Historiadora especializada no património cultural e arqueológico da região do Caramulo.',
  },
  {
    id: '3',
    name: 'Eng. Carlos Oliveira',
    role: 'Secretário',
    bio: 'Engenheiro ambiental com foco em projetos de conservação e sustentabilidade.',
  },
  {
    id: '4',
    name: 'Dra. Ana Rodrigues',
    role: 'Tesoureira',
    bio: 'Bióloga especializada em flora autóctone e conservação de habitats da Serra do Caramulo.',
  },
];

export const activities: Activity[] = [
  {
    id: '1',
    title: 'Caminhada pelo Vale do Alfusqueiro',
    description: 'Percurso interpretativo pela biodiversidade do Vale do Alfusqueiro, com paragens para observação de flora e fauna.',
    date: '2024-04-15',
    category: 'caminhada',
    location: 'Vale do Alfusqueiro',
  },
  {
    id: '2',
    title: 'Workshop de Fotografia de Natureza',
    description: 'Aprenda técnicas de fotografia de natureza com profissionais, nos cenários deslumbrantes da serra.',
    date: '2024-05-20',
    category: 'workshop',
    location: 'Miradouro do Caramulo',
  },
  {
    id: '3',
    title: 'Palestra: Geologia da Serra do Caramulo',
    description: 'Conferência sobre a formação geológica e os recursos minerais da Serra do Caramulo.',
    date: '2024-06-10',
    category: 'palestra',
    location: 'Auditório Municipal',
  },
  {
    id: '4',
    title: 'Festival da Biodiversidade',
    description: 'Evento anual dedicado à celebração da riqueza biológica da serra, com atividades para todas as idades.',
    date: '2024-07-05',
    category: 'evento',
    location: 'Parque da Serra',
  },
  {
    id: '5',
    title: 'Formação em Identificação de Espécies',
    description: 'Curso prático de identificação de espécies vegetais autóctones da Serra do Caramulo.',
    date: '2024-08-12',
    category: 'formacao',
    location: 'Sede CEISCaramulo',
  },
  {
    id: '6',
    title: 'Caminhada Nocturna — Observação de Estrelas',
    description: 'Percurso noturno com sessão de astronomia no topo da Serra do Caramulo.',
    date: '2024-09-01',
    category: 'caminhada',
    location: 'Alto do Caramulo',
  },
];

export const newsArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'CEISCaramulo lança novo projeto de conservação',
    excerpt: 'A associação iniciou um ambicioso projeto de monitorização da biodiversidade na Serra do Caramulo.',
    content: 'A associação CEISCaramulo deu início a um novo e ambicioso projeto de monitorização da biodiversidade na Serra do Caramulo. O projeto, financiado pelo programa LIFE da União Europeia, terá a duração de três anos e envolverá uma equipa multidisciplinar de biólogos, ecólogos e geólogos.\n\nO principal objetivo é criar um inventário exaustivo das espécies presentes na serra, com especial atenção para as espécies endémicas e ameaçadas. Serão utilizadas técnicas de monitorização avançadas, incluindo armadilhagem fotográfica, recolha de ADN ambiental e levantamentos acústicos para identificação de morcegos e aves.\n\nEste projeto representa um marco importante para a conservação da Serra do Caramulo e permitirá fundamentar futuras ações de proteção e gestão do território.',
    date: '2024-03-01',
    author: 'Redação CEISCaramulo',
    category: 'Projetos',
    slug: 'novo-projeto-conservacao',
  },
  {
    id: '2',
    title: 'Descoberta nova espécie de líquen na Serra',
    excerpt: 'Investigadores do CEISCaramulo identificaram uma nova espécie de líquen endémica da região.',
    content: 'Uma equipa de investigadores do CEISCaramulo, em colaboração com a Universidade de Coimbra, identificou uma nova espécie de líquen que aparenta ser endémica da Serra do Caramulo. A descoberta foi feita durante um levantamento de campo realizado no outono de 2023.\n\nO líquen, provisoriamente denominado Lobaria caramulensis, foi encontrado em cascas de carvalhos centenários numa zona de floresta autóctone bem preservada. A espécie distingue-se das congéneres pelo seu padrão de ramificação único e pela coloração esverdeada intensa.\n\nA descrição formal da espécie será publicada na revista Lichenologist e representa uma contribuição significativa para o conhecimento da biodiversidade da região.',
    date: '2024-02-15',
    author: 'Dr. António Silva',
    category: 'Investigação',
    slug: 'nova-especie-liquen',
  },
  {
    id: '3',
    title: 'Programa educativo atinge 500 participantes',
    excerpt: 'O programa de educação ambiental do CEISCaramulo já envolveu mais de 500 alunos da região.',
    content: 'O programa de educação ambiental "Conhecer para Proteger", desenvolvido pelo CEISCaramulo em parceria com agrupamentos escolares da região, atingiu a marca de 500 participantes desde o seu lançamento em setembro de 2023.\n\nO programa inclui visitas guiadas à serra, workshops de identificação de espécies, ateliers de reutilização de materiais e palestras sobre conservação ambiental. Destinado a alunos do 1.º ao 9.º ano, o programa tem recebido feedback muito positivo de professores e encarregados de educação.\n\nPara o próximo ano letivo, o CEISCaramulo planeia expandir o programa para incluir escolas secundárias e introduzir módulos sobre alterações climáticas e sustentabilidade.',
    date: '2024-01-20',
    author: 'Dra. Maria Fernandes',
    category: 'Educação',
    slug: 'programa-educativo-500',
  },
  {
    id: '4',
    title: 'Parceria com Universidade de Coimbra',
    excerpt: 'O CEISCaramulo celebrou um protocolo de colaboração com o Departamento de Ciências da Vida da UC.',
    content: 'O CEISCaramulo e a Universidade de Coimbra assinaram um protocolo de colaboração que estabelece uma parceria estratégica entre as duas instituições. O acordo prevê a realização conjunta de projetos de investigação, o acolhimento de estágios curriculares e a organização de eventos científicos.\n\nA parceria permitirá ao CEISCaramulo aceder a recursos laboratoriais e conhecimento especializado, enquanto a universidade beneficiará de um território de estudo privilegiado e de dados de campo recolhidos pela associação.\n\nO primeiro projeto conjunto, focado na ecologia de anfíbios da Serra do Caramulo, terá início na primavera de 2024.',
    date: '2024-01-10',
    author: 'Redação CEISCaramulo',
    category: 'Parcerias',
    slug: 'parceria-universidade-coimbra',
  },
];

export const projects: Project[] = [
  {
    id: '1',
    title: 'Monitorização da Biodiversidade',
    description: 'Projeto de longo prazo para monitorização e catalogação da biodiversidade da Serra do Caramulo.',
    status: 'em_curso',
    startDate: '2023-01-01',
    partners: ['Universidade de Coimbra', 'ICNF'],
  },
  {
    id: '2',
    title: 'Trilhos Interpretativos',
    description: 'Criação de percursos pedestres interpretativos com sinalética e informação sobre flora, fauna e geologia.',
    status: 'em_curso',
    startDate: '2023-06-01',
    partners: ['Câmara Municipal de Tondela'],
  },
  {
    id: '3',
    title: 'Arquivo Digital do Caramulo',
    description: 'Digitalização e preservação de documentos históricos, fotografias e relatos sobre a Serra do Caramulo.',
    status: 'em_curso',
    startDate: '2022-09-01',
    partners: ['Arquivo Municipal'],
  },
  {
    id: '4',
    title: 'Reflorestação com Espécies Autóctones',
    description: 'Projeto de reflorestação de áreas ardidas com espécies nativas como carvalhos e castanheiros.',
    status: 'concluido',
    startDate: '2021-01-01',
    endDate: '2023-12-31',
    partners: ['ICNF', 'Quercus'],
  },
];

export const publications: Publication[] = [
  {
    id: '1',
    title: 'Flora da Serra do Caramulo — Guia de Campo',
    author: 'Dr. António Silva et al.',
    year: 2023,
    type: 'livro',
    description: 'Guia ilustrado com mais de 200 espécies vegetais identificadas na Serra do Caramulo.',
  },
  {
    id: '2',
    title: 'Relatório Anual de Biodiversidade 2023',
    author: 'CEISCaramulo',
    year: 2023,
    type: 'relatorio',
    description: 'Relatório completo sobre o estado da biodiversidade na Serra do Caramulo.',
  },
  {
    id: '3',
    title: 'A Geologia do Maciço do Caramulo',
    author: 'Eng. José Martins',
    year: 2022,
    type: 'artigo',
    description: 'Estudo detalhado da formação geológica e recursos minerais do maciço.',
  },
  {
    id: '4',
    title: 'Património Arqueológico da Serra',
    author: 'Dra. Maria Fernandes',
    year: 2021,
    type: 'artigo',
    description: 'Levantamento dos sítios arqueológicos e vestígios históricos da região.',
  },
];

export const galleryItems: GalleryItem[] = [
  { id: '1', title: 'Nascer do sol no Alto do Caramulo', type: 'foto', url: '/placeholder.svg', category: 'Paisagens', date: '2024-02-10' },
  { id: '2', title: 'Carvalho-roble centenário', type: 'foto', url: '/placeholder.svg', category: 'Flora', date: '2024-01-15' },
  { id: '3', title: 'Águia-de-asa-redonda', type: 'foto', url: '/placeholder.svg', category: 'Fauna', date: '2023-12-20' },
  { id: '4', title: 'Cascata do Alfusqueiro', type: 'foto', url: '/placeholder.svg', category: 'Paisagens', date: '2023-11-05' },
  { id: '5', title: 'Caminhada interpretativa', type: 'foto', url: '/placeholder.svg', category: 'Atividades', date: '2023-10-15' },
  { id: '6', title: 'Workshop de fotografia', type: 'foto', url: '/placeholder.svg', category: 'Atividades', date: '2023-09-20' },
  { id: '7', title: 'Névoa na serra', type: 'foto', url: '/placeholder.svg', category: 'Paisagens', date: '2023-08-10' },
  { id: '8', title: 'Lírios selvagens', type: 'foto', url: '/placeholder.svg', category: 'Flora', date: '2023-07-05' },
];

export const serraInfoSections: SerraInfo[] = [
  {
    title: 'Geografia',
    description: 'A Serra do Caramulo situa-se entre os distritos de Viseu e Aveiro, atingindo os 1075 metros de altitude no ponto mais alto, o Caramulinho.',
    items: ['Altitude máxima: 1075m', 'Área: ~120 km²', 'Distritos: Viseu e Aveiro', 'Concelhos: Tondela, Vouzela, Águeda, Oliveira de Frades'],
  },
  {
    title: 'Flora',
    description: 'A Serra do Caramulo possui uma rica biodiversidade vegetal, desde carvalhos e castanheiros nas zonas mais baixas até urzes e tojo nas altitudes superiores.',
    items: ['Carvalho-roble (Quercus robur)', 'Castanheiro (Castanea sativa)', 'Urze (Erica sp.)', 'Azevinho (Ilex aquifolium)', 'Pinheiro-bravo (Pinus pinaster)'],
  },
  {
    title: 'Fauna',
    description: 'A fauna da Serra do Caramulo inclui diversas espécies de aves de rapina, mamíferos e anfíbios de elevado valor conservacionista.',
    items: ['Águia-de-asa-redonda', 'Raposa-vermelha', 'Salamandra-lusitânica', 'Geneta', 'Bufo-real'],
  },
  {
    title: 'Geologia',
    description: 'O maciço do Caramulo é constituído predominantemente por granitos e xistos, com formações rochosas que datam do período Pré-Câmbrico.',
    items: ['Granitos hercínicos', 'Xistos do Pré-Câmbrico', 'Filões de quartzo', 'Minas de estanho e volfrâmio'],
  },
];
