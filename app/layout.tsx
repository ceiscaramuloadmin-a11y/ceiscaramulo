import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import localFont from 'next/font/local';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const coolvetica = localFont({
  src: '../src/assets/coolvetica/Coolvetica Rg.otf',
  variable: '--font-coolvetica',
  display: 'optional',
  fallback: ['Arial Black', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: {
    default: 'CEISCaramulo — Centro de Estudos e Interpretação da Serra do Caramulo',
    template: '%s | CEISCaramulo',
  },
  description:
    'Associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.',
  keywords: [
    'CEISCaramulo',
    'Serra do Caramulo',
    'associação',
    'património natural',
    'património cultural',
    'notícias',
    'atividades',
    'projetos',
    'biblioteca',
    'conservação da natureza',
    'educação ambiental',
    'Tondela',
    'Viseu',
  ],
  authors: [{ name: 'CEISCaramulo' }],
  creator: 'CEISCaramulo',
  publisher: 'CEISCaramulo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ceiscaramulo.pt'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: 'https://ceiscaramulo.pt',
    title: 'CEISCaramulo — Centro de Estudos e Interpretação da Serra do Caramulo',
    description:
      'Associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'CEISCaramulo - Serra do Caramulo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CEISCaramulo — Centro de Estudos e Interpretação da Serra do Caramulo',
    description:
      'Associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${coolvetica.variable} font-body antialiased`}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
