import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.yatricloud.com';
const SITE_NAME = 'Yatri Cloud';
const DEFAULT_IMAGE =
  'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
}

// Sitewide structured data, rendered once and kept in <head> for every route.
const SITE_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    sameAs: [
      'https://www.youtube.com/@yatricloud',
      'https://linkedin.com/company/yatricloud',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  },
];

export const SEO = ({
  title = 'Yatri Cloud · 50% OFF Cloud Certification Vouchers',
  description = 'Free practice tests, verified exam dumps and 50% OFF vouchers for AWS, Azure, GCP, Kubernetes and DevOps certifications. Join 50K+ happy learners.',
  image = DEFAULT_IMAGE,
  type = 'website',
  url,
  canonical,
  noindex = false,
  jsonLd,
}: SEOProps) => {
  const location = useLocation();
  const currentUrl = canonical || url || `${SITE_URL}${location.pathname}`;
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    // Primary meta tags
    updateMetaTag('description', description);
    updateMetaTag('title', title);

    // Robots (noindex for private/utility pages, reset elsewhere)
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:site_name', SITE_NAME, true);

    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Canonical URL
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', currentUrl);

    // Sitewide JSON-LD (Organization + WebSite) — rendered once, never removed
    if (!document.getElementById('seo-jsonld-site')) {
      const siteScript = document.createElement('script');
      siteScript.type = 'application/ld+json';
      siteScript.id = 'seo-jsonld-site';
      siteScript.textContent = JSON.stringify(SITE_JSON_LD);
      document.head.appendChild(siteScript);
    }

    // Per-page JSON-LD — replaced on each route/page change
    let pageScript = document.getElementById('seo-jsonld-page') as HTMLScriptElement | null;
    if (jsonLdString) {
      if (!pageScript) {
        pageScript = document.createElement('script');
        pageScript.type = 'application/ld+json';
        pageScript.id = 'seo-jsonld-page';
        document.head.appendChild(pageScript);
      }
      pageScript.textContent = jsonLdString;
    } else if (pageScript) {
      pageScript.remove();
    }

    return () => {
      // Clean up per-page JSON-LD so it never leaks to the next route
      const stale = document.getElementById('seo-jsonld-page');
      if (stale) stale.remove();
    };
  }, [title, description, image, type, currentUrl, noindex, jsonLdString]);

  return null;
};
