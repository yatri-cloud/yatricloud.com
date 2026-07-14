import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Dynamic per-post blog sitemap (served at /sitemap-blog.xml via a rewrite).
 * Queries the published-only `blog_feed` view and emits a URL per story +
 * per author page, always fresh — no regeneration needed. Cached at the edge
 * for an hour. Referenced from robots.txt so search engines discover it.
 */

const BASE = "https://www.yatricloud.com";
const xmlEscape = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const urls: { loc: string; lastmod?: string; priority: string; changefreq: string }[] = [
    { loc: `${BASE}/blog`, priority: "0.9", changefreq: "daily" },
  ];

  try {
    if (url && key) {
      const r = await fetch(
        `${url}/rest/v1/blog_feed?select=slug,updated_at,published_at,author_id&order=published_at.desc&limit=5000`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      if (r.ok) {
        const rows = (await r.json()) as { slug: string; updated_at: string; published_at: string; author_id: string }[];
        const authors = new Set<string>();
        for (const p of rows) {
          urls.push({
            loc: `${BASE}/blog/${xmlEscape(p.slug)}`,
            lastmod: (p.updated_at || p.published_at || "").slice(0, 10) || undefined,
            priority: "0.8",
            changefreq: "weekly",
          });
          authors.add(p.author_id);
        }
        for (const id of authors) urls.push({ loc: `${BASE}/blog/author/${id}`, priority: "0.5", changefreq: "weekly" });
      }
    }
  } catch {
    /* fall through to at least the /blog entry */
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
      .join("\n") +
    `\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(body);
}
