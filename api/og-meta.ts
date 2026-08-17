import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_IMAGE = "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png";
const SITE_NAME = "Yatri Cloud";
const SITE_URL = "https://www.yatricloud.com";

function escapeHtml(str: string): string {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const slug = (req.query.slug as string || "").trim();
    const type = (req.query.type as string || "event").toLowerCase();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://lprejdcudtkuxjwghesv.supabase.co";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let title = "Yatri Cloud · Empowering Cloud Learners";
    let description = "Community events, hands-on cloud certifications, and technical hackathons by Yatri Cloud.";
    let imageUrl = DEFAULT_IMAGE;
    let targetPath = type === "upcoming-event" ? `/upcoming-event/${slug}` : `/events/${slug}`;

    if (slug && supabaseUrl && serviceKey) {
        const headers = {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
        };

        try {
            if (type === "event" || type === "upcoming-event") {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
                const queryFilter = isUuid ? `id=eq.${encodeURIComponent(slug)}` : `slug=ilike.${encodeURIComponent(slug)}`;

                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/events?${queryFilter}&select=id,name,description,image_url,slug&limit=1`,
                    { headers }
                );

                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.length > 0) {
                        const event = data[0];
                        title = `${event.name} — Yatri Cloud Event`;
                        if (event.description) description = event.description.slice(0, 280);
                        if (event.image_url) imageUrl = event.image_url;
                        targetPath = type === "upcoming-event"
                            ? `/upcoming-event/${event.slug || event.id}`
                            : `/events/${event.slug || event.id}`;
                    }
                }
            } else if (type === "training") {
                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/trainings?slug=ilike.${encodeURIComponent(slug)}&select=id,name,course_title,description,image_url,slug&limit=1`,
                    { headers }
                );

                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.length > 0) {
                        const tr = data[0];
                        title = `${tr.course_title || tr.name} — Yatri Cloud Training`;
                        if (tr.description) description = tr.description.slice(0, 280);
                        if (tr.image_url) imageUrl = tr.image_url;
                        targetPath = `/training/${tr.slug || tr.id}`;
                    }
                }
            } else if (type === "blog") {
                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/blog_posts?slug=ilike.${encodeURIComponent(slug)}&select=id,title,subtitle,excerpt,cover_image_url,slug&limit=1`,
                    { headers }
                );

                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.length > 0) {
                        const post = data[0];
                        title = `${post.title} | Yatri Blog`;
                        description = (post.subtitle || post.excerpt || description).slice(0, 280);
                        if (post.cover_image_url) imageUrl = post.cover_image_url;
                        targetPath = `/blog/${post.slug || post.id}`;
                    }
                }
            }
        } catch (err) {
            console.error("[og-meta] Error fetching metadata from Supabase:", err);
        }
    }

    const canonicalUrl = `${SITE_URL}${targetPath}`;
    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(description);
    const safeImage = escapeHtml(imageUrl);
    const safeCanonical = escapeHtml(canonicalUrl);

    // Cache headers: cache for 10 minutes at edge, 1 hour stale
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:secure_url" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@yatricloud" />
  <meta name="twitter:url" content="${safeCanonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Canonical link -->
  <link rel="canonical" href="${safeCanonical}" />

  <!-- Instant Client Redirect for Browsers -->
  <meta http-equiv="refresh" content="0;url=${safeCanonical}" />
  <script>
    window.location.replace("${safeCanonical}");
  </script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; padding: 2rem; text-align: center;">
  <h2>${safeTitle}</h2>
  <p>${safeDesc}</p>
  <p><a href="${safeCanonical}">Click here to view this on Yatri Cloud</a></p>
</body>
</html>`;

    return res.status(200).send(html);
}
