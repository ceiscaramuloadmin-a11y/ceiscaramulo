import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const news = [
  {
    title: 'CEISCaramulo lança novo projeto de conservação',
    slug: 'novo-projeto-conservacao',
    excerpt: 'A associação iniciou um ambicioso projeto de monitorização da biodiversidade na Serra do Caramulo.',
    content:
      'A associação CEISCaramulo deu início a um novo e ambicioso projeto de monitorização da biodiversidade na Serra do Caramulo. O projeto, financiado pelo programa LIFE da União Europeia, terá a duração de três anos e envolverá uma equipa multidisciplinar de biólogos, ecólogos e geólogos.\n\nO principal objetivo é criar um inventário exaustivo das espécies presentes na serra, com especial atenção para as espécies endémicas e ameaçadas. Serão utilizadas técnicas de monitorização avançadas, incluindo armadilhagem fotográfica, recolha de ADN ambiental e levantamentos acústicos para identificação de morcegos e aves.\n\nEste projeto representa um marco importante para a conservação da Serra do Caramulo e permitirá fundamentar futuras ações de proteção e gestão do território.',
    author: 'Redação CEISCaramulo',
    category: 'Projetos',
    image: '/placeholder.svg',
    published: true,
    publishedAt: new Date('2024-03-01'),
  },
  {
    title: 'Descoberta nova espécie de líquen na Serra',
    slug: 'nova-especie-liquen',
    excerpt: 'Investigadores do CEISCaramulo identificaram uma nova espécie de líquen endémica da região.',
    content:
      'Uma equipa de investigadores do CEISCaramulo, em colaboração com a Universidade de Coimbra, identificou uma nova espécie de líquen que aparenta ser endémica da Serra do Caramulo. A descoberta foi feita durante um levantamento de campo realizado no outono de 2023.\n\nO líquen, provisoriamente denominado Lobaria caramulensis, foi encontrado em cascas de carvalhos centenários numa zona de floresta autóctone bem preservada. A espécie distingue-se das congéneres pelo seu padrão de ramificação único e pela coloração esverdeada intensa.\n\nA descrição formal da espécie será publicada na revista Lichenologist e representa uma contribuição significativa para o conhecimento da biodiversidade da região.',
    author: 'Dr. António Silva',
    category: 'Investigação',
    image: '/placeholder.svg',
    published: true,
    publishedAt: new Date('2024-02-15'),
  },
  {
    title: 'Programa educativo atinge 500 participantes',
    slug: 'programa-educativo-500',
    excerpt: 'O programa de educação ambiental do CEISCaramulo já envolveu mais de 500 alunos da região.',
    content:
      'O programa de educação ambiental "Conhecer para Proteger", desenvolvido pelo CEISCaramulo em parceria com agrupamentos escolares da região, atingiu a marca de 500 participantes desde o seu lançamento em setembro de 2023.\n\nO programa inclui visitas guiadas à serra, workshops de identificação de espécies, ateliers de reutilização de materiais e palestras sobre conservação ambiental. Destinado a alunos do 1.º ao 9.º ano, o programa tem recebido feedback muito positivo de professores e encarregados de educação.\n\nPara o próximo ano letivo, o CEISCaramulo planeia expandir o programa para incluir escolas secundárias e introduzir módulos sobre alterações climáticas e sustentabilidade.',
    author: 'Dra. Maria Fernandes',
    category: 'Educação',
    image: '/placeholder.svg',
    published: true,
    publishedAt: new Date('2024-01-20'),
  },
  {
    title: 'Parceria com Universidade de Coimbra',
    slug: 'parceria-universidade-coimbra',
    excerpt: 'O CEISCaramulo celebrou um protocolo de colaboração com o Departamento de Ciências da Vida da UC.',
    content:
      'O CEISCaramulo e a Universidade de Coimbra assinaram um protocolo de colaboração que estabelece uma parceria estratégica entre as duas instituições. O acordo prevê a realização conjunta de projetos de investigação, o acolhimento de estágios curriculares e a organização de eventos científicos.\n\nA parceria permitirá ao CEISCaramulo aceder a recursos laboratoriais e conhecimento especializado, enquanto a universidade beneficiará de um território de estudo privilegiado e de dados de campo recolhidos pela associação.\n\nO primeiro projeto conjunto, focado na ecologia de anfíbios da Serra do Caramulo, terá início na primavera de 2024.',
    author: 'Redação CEISCaramulo',
    category: 'Parcerias',
    image: '/placeholder.svg',
    published: true,
    publishedAt: new Date('2024-01-10'),
  },
];

const activities = [
  {
    title: 'Caminhada pelo Vale do Alfusqueiro',
    description: 'Percurso interpretativo pela biodiversidade do Vale do Alfusqueiro, com paragens para observação de flora e fauna.',
    date: new Date('2024-04-15'),
    location: 'Vale do Alfusqueiro',
    category: 'caminhada',
    image: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Workshop de Fotografia de Natureza',
    description: 'Aprenda técnicas de fotografia de natureza com profissionais, nos cenários deslumbrantes da serra.',
    date: new Date('2024-05-20'),
    location: 'Miradouro do Caramulo',
    category: 'workshop',
    image: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Palestra: Geologia da Serra do Caramulo',
    description: 'Conferência sobre a formação geológica e os recursos minerais da Serra do Caramulo.',
    date: new Date('2024-06-10'),
    location: 'Auditório Municipal',
    category: 'palestra',
    image: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Festival da Biodiversidade',
    description: 'Evento anual dedicado à celebração da riqueza biológica da serra, com atividades para todas as idades.',
    date: new Date('2024-07-05'),
    location: 'Parque da Serra',
    category: 'evento',
    image: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Formação em Identificação de Espécies',
    description: 'Curso prático de identificação de espécies vegetais autóctones da Serra do Caramulo.',
    date: new Date('2024-08-12'),
    location: 'Sede CEISCaramulo',
    category: 'formacao',
    image: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Caminhada Nocturna - Observação de Estrelas',
    description: 'Percurso noturno com sessão de astronomia no topo da Serra do Caramulo.',
    date: new Date('2024-09-01'),
    location: 'Alto do Caramulo',
    category: 'caminhada',
    image: '/placeholder.svg',
    published: true,
  },
];

const projects = [
  {
    title: 'Monitorização da Biodiversidade',
    description: 'Projeto de longo prazo para monitorização e catalogação da biodiversidade da Serra do Caramulo.',
    status: 'em_curso',
    startDate: new Date('2023-01-01'),
    partners: ['Universidade de Coimbra', 'ICNF'],
    image: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Trilhos Interpretativos',
    description: 'Criação de percursos pedestres interpretativos com sinalética e informação sobre flora, fauna e geologia.',
    status: 'em_curso',
    startDate: new Date('2023-06-01'),
    partners: ['Câmara Municipal de Tondela'],
    image: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Arquivo Digital do Caramulo',
    description: 'Digitalização e preservação de documentos históricos, fotografias e relatos sobre a Serra do Caramulo.',
    status: 'em_curso',
    startDate: new Date('2022-09-01'),
    partners: ['Arquivo Municipal'],
    image: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Reflorestação com Espécies Autóctones',
    description: 'Projeto de reflorestação de áreas ardidas com espécies nativas como carvalhos e castanheiros.',
    status: 'concluido',
    startDate: new Date('2021-01-01'),
    endDate: new Date('2023-12-31'),
    partners: ['ICNF', 'Quercus'],
    image: '/placeholder.svg',
    published: true,
  },
];

const publications = [
  {
    title: 'Flora da Serra do Caramulo - Guia de Campo',
    author: 'Dr. António Silva et al.',
    year: 2023,
    type: 'livro',
    description: 'Guia ilustrado com mais de 200 espécies vegetais identificadas na Serra do Caramulo.',
    coverImage: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Relatório Anual de Biodiversidade 2023',
    author: 'CEISCaramulo',
    year: 2023,
    type: 'relatorio',
    description: 'Relatório completo sobre o estado da biodiversidade na Serra do Caramulo.',
    coverImage: '/placeholder.svg',
    published: true,
  },
  {
    title: 'A Geologia do Maciço do Caramulo',
    author: 'Eng. José Martins',
    year: 2022,
    type: 'artigo',
    description: 'Estudo detalhado da formação geológica e recursos minerais do maciço.',
    coverImage: '/placeholder.svg',
    published: true,
  },
  {
    title: 'Património Arqueológico da Serra',
    author: 'Dra. Maria Fernandes',
    year: 2021,
    type: 'artigo',
    description: 'Levantamento dos sítios arqueológicos e vestígios históricos da região.',
    coverImage: '/placeholder.svg',
    published: true,
  },
];

async function main() {
  await prisma.contentComment.deleteMany();
  await prisma.news.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.project.deleteMany();
  await prisma.publication.deleteMany();

  await prisma.news.createMany({ data: news });
  await prisma.activity.createMany({ data: activities });
  await prisma.project.createMany({ data: projects });
  await prisma.publication.createMany({ data: publications });

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
