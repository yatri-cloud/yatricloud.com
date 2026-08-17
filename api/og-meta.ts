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
    let description = "Community events, hands-on cloud certifications, vouchers and expert-led trainings by Yatri Cloud.";
    let imageUrl = DEFAULT_IMAGE;
    let targetPath = "/";

    if (type === "upcoming-event") targetPath = `/upcoming-event/${slug}`;
    else if (type === "event") targetPath = `/events/${slug}`;
    else if (type === "training") targetPath = `/training/${slug}`;
    else if (type === "blog") targetPath = `/blog/${slug}`;
    else if (type === "certificate") targetPath = `/certificate/${slug}`;
    else if (type === "mentor" || type === "mentorship") targetPath = `/mentorship/${slug}`;
    else if (type === "yatri" || type === "profile") targetPath = `/yatri/${slug}`;
    else if (type === "store" || type === "product") targetPath = `/yatristore/${slug}`;
    else if (type === "examdump") targetPath = `/examdumps/${slug}`;

    if (slug && supabaseUrl && serviceKey) {
        const headers = {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
        };

        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

            if (type === "event" || type === "upcoming-event") {
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
                const queryFilter = isUuid ? `id=eq.${encodeURIComponent(slug)}` : `slug=ilike.${encodeURIComponent(slug)}`;
                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/trainings?${queryFilter}&select=id,name,course_title,description,image_url,slug&limit=1`,
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
                const queryFilter = isUuid ? `id=eq.${encodeURIComponent(slug)}` : `slug=ilike.${encodeURIComponent(slug)}`;
                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/blog_posts?${queryFilter}&select=id,title,subtitle,excerpt,cover_image_url,slug&limit=1`,
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
            } else if (type === "certificate") {
                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/certificates?serial=eq.${encodeURIComponent(slug)}&select=serial,recipient_name,course_title,event_name&limit=1`,
                    { headers }
                );

                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.length > 0) {
                        const cert = data[0];
                        title = `Certificate of Completion — ${cert.recipient_name} | Yatri Cloud`;
                        description = `Verified Certificate of Completion for ${cert.course_title || cert.event_name || "Cloud Training"} issued by Yatri Cloud.`;
                        targetPath = `/certificate/${cert.serial}`;
                    }
                }
            } else if (type === "mentor" || type === "mentorship") {
                const queryFilter = isUuid ? `id=eq.${encodeURIComponent(slug)}` : `slug=ilike.${encodeURIComponent(slug)}`;
                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/mentors?${queryFilter}&select=id,name,headline,bio,avatar_url,image_url,slug&limit=1`,
                    { headers }
                );

                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.length > 0) {
                        const mentor = data[0];
                        title = `${mentor.name} — Cloud Mentor | Yatri Cloud`;
                        if (mentor.headline || mentor.bio) description = (mentor.headline || mentor.bio).slice(0, 280);
                        if (mentor.avatar_url || mentor.image_url) imageUrl = mentor.avatar_url || mentor.image_url;
                        targetPath = `/mentorship/${mentor.slug || mentor.id}`;
                    }
                }
            } else if (type === "yatri" || type === "profile") {
                const queryFilter = isUuid ? `id=eq.${encodeURIComponent(slug)}` : `username=ilike.${encodeURIComponent(slug)}`;
                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/profiles?${queryFilter}&select=id,full_name,username,avatar_url,bio,headline&limit=1`,
                    { headers }
                );

                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.length > 0) {
                        const prof = data[0];
                        title = `${prof.full_name || prof.username} | Yatri Profile`;
                        if (prof.headline || prof.bio) description = (prof.headline || prof.bio).slice(0, 280);
                        if (prof.avatar_url) imageUrl = prof.avatar_url;
                        targetPath = `/yatri/${prof.username || prof.id}`;
                    }
                }
            } else if (type === "store" || type === "product") {
                const queryFilter = isUuid ? `id=eq.${encodeURIComponent(slug)}` : `title=ilike.${encodeURIComponent(slug)}`;
                const resp = await fetch(
                    `${supabaseUrl}/rest/v1/products?${queryFilter}&select=id,title,description,image_url&limit=1`,
                    { headers }
                );

                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.length > 0) {
                        const prod = data[0];
                        title = `${prod.title} | Yatri Store`;
                        if (prod.description) description = prod.description.slice(0, 280);
                        if (prod.image_url) imageUrl = prod.image_url;
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
