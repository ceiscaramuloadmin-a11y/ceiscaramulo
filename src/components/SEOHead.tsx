import { useEffect, useMemo } from 'react';

import { defaultSEO, siteConfig } from '../data/site';
import type { SEOData } from '../types';

type SEOHeadProps = Partial<SEOData>;

const SEOHead: React.FC<SEOHeadProps> = (props) => {
  const seo = useMemo(() => ({ ...defaultSEO, ...props }), [props]);

  useEffect(() => {
    document.documentElement.lang = 'pt-PT';
    document.title = seo.title;

    const canonicalUrl = seo.canonical || window.location.href;
    const ogImage = absoluteUrl(seo.ogImage || siteConfig.ogImage);
    const structuredData = seo.structuredData || buildDefaultStructuredData(canonicalUrl);

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;

      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }

      el.content = content;
    };

    setMeta('description', seo.description);
    setMeta('keywords', seo.keywords);
    setMeta('author', siteConfig.fullName);
    setMeta('application-name', siteConfig.name);
    setMeta('robots', seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('theme-color', '#27441d');

    setMeta('og:title', seo.title, true);
    setMeta('og:description', seo.description, true);
    setMeta('og:type', seo.ogType || 'website', true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:site_name', siteConfig.fullName, true);
    setMeta('og:locale', siteConfig.locale, true);
    setMeta('og:image', ogImage, true);

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', seo.title);
    setMeta('twitter:description', seo.description);
    setMeta('twitter:image', ogImage);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    let jsonLd = document.querySelector('script[data-seo-jsonld="true"]') as HTMLScriptElement | null;
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.dataset.seoJsonld = 'true';
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify(structuredData);
  }, [seo]);

  return null;
};

function buildDefaultStructuredData(canonicalUrl: string) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteConfig.fullName,
      url: siteConfig.url,
      logo: absoluteUrl(siteConfig.ogImage),
      email: siteConfig.email,
      sameAs: siteConfig.socialProfiles,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.fullName,
      url: siteConfig.url,
      inLanguage: 'pt-PT',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteConfig.url}/noticias`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: document.title || siteConfig.fullName,
      url: canonicalUrl,
      inLanguage: 'pt-PT',
      isPartOf: siteConfig.url,
    },
  ];
}

function absoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}

export default SEOHead;
