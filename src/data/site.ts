import type { ContactInfo, SEOData } from '../types';

export const siteConfig = {
  name: 'CEISCaramulo',
  fullName: 'Centro de Estudos e Interpretação da Serra do Caramulo',
  tagline: 'Preservar, estudar e divulgar o património da Serra do Caramulo',
  description:
    'O CEISCaramulo é uma associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.',
  url: 'https://ceiscaramulo.pt',
  locale: 'pt_PT',
  founded: 2010,
  email: 'ceiscaramulo@gmail.com',
  ogImage: '/og-image.svg',
  socialProfiles: [
    'https://facebook.com/CEISCaramulo',
    // 'https://instagram.com/ceiscaramulo',
    // 'https://youtube.com/@ceiscaramulo',
  ],
};

export const defaultSEO: SEOData = {
  title: 'CEISCaramulo — Centro de Estudos e Interpretação da Serra do Caramulo',
  description:
    'Associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo. Notícias, atividades, projetos, biblioteca e recursos multimédia.',
  keywords:
    'CEISCaramulo, Serra do Caramulo, associação, património natural, património cultural, notícias, atividades, projetos, biblioteca, conservação da natureza, educação ambiental, Tondela, Viseu',
  ogImage: siteConfig.ogImage,
  ogType: 'website',
};

export const contactInfo: ContactInfo = {
  address: 'Rua Principal, n.º 10',
  postalCode: '3460-050',
  city: 'Caramulo',
  phone: '+351 966 717 360',
  email: siteConfig.email,
  coordinates: { lat: 40.5731, lng: -8.1683 },
  socialMedia: {
    facebook: 'https://facebook.com/CEISCaramulo',
    // instagram: 'https://instagram.com/ceiscaramulo',
    // youtube: 'https://youtube.com/@ceiscaramulo',
  },
};
