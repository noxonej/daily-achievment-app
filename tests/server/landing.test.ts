import { describe, expect, it } from 'vitest';
import { landingHtml, sitemapXml } from '../../landing/landing';

const URL = 'https://squzo.app/';

describe('landing pages', () => {
  it('has SEO basics in both languages', () => {
    for (const lang of ['en', 'lt'] as const) {
      const html = landingHtml(lang, URL);
      expect(html).toContain(`<html lang="${lang}">`);
      expect(html).toMatch(/<title>[^<]{20,70}<\/title>/);
      expect(html).toContain('name="description"');
      expect(html).toContain(`rel="canonical" href="${URL}welcome/${lang === 'lt' ? 'lt/' : ''}"`);
      expect(html).toContain('hreflang="lt"');
      expect(html).toContain('application/ld+json');
      expect(html).toContain(`href="${URL}?source=landing-${lang}"`);
    }
  });
  it('lists the pages in the sitemap', () => {
    expect(sitemapXml(URL)).toContain('<loc>https://squzo.app/welcome/lt/</loc>');
  });
});
