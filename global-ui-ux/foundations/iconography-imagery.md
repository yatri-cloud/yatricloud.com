# Iconography & Imagery

The details that quietly separate polished from amateur.

## Icons

### The rules
- **Use a vector icon set — never emoji as structural icons.** Emoji (🚀 ⚙️ 🎨) render differently
  per OS/browser, can't be themed, and can't match your stroke weight. They read as unprofessional in
  navigation, buttons, and system UI. Good sets: **Lucide** (default recommendation), Heroicons,
  Phosphor, Radix Icons, Tabler.
- **One family, everywhere.** Don't mix Lucide with Font Awesome with custom SVGs. One visual
  language: same stroke width, same corner radius, same optical weight.
- **Consistent sizing** via tokens: `icon-sm 16px`, `icon-md 20–24px`, `icon-lg 32px`. Don't scatter
  18/21/26px randomly.
- **Consistent stroke width** within a layer (e.g. 1.5px or 2px). Mixing thick and thin icons looks
  broken.
- **Filled vs outline discipline**: pick one style per hierarchy level. Outline for inactive, filled
  for active is a valid, common pattern — just be consistent.
- **Alignment**: align icons to the text baseline / optical center; keep consistent padding. A
  slightly-off icon in a button is a visible flaw.
- **Accessibility**: icon-only buttons need `aria-label`. Decorative icons get `aria-hidden="true"`.
  Icon contrast ≥ 3:1. Icon-only tap targets still need 44×44px (expand the hit area if the glyph is
  small).

### Icons + text
An icon should *reinforce* a label, not replace it (except for universally-understood glyphs: close
×, search 🔍, menu ≡, chevrons). When in doubt, add the word. Icon-only navigation hurts
discoverability.

## Images

### Performance (also a UX and Core Web Vitals concern)
- **Modern formats**: WebP or AVIF over JPEG/PNG — often 30–50% smaller at equal quality.
- **Always set `width`/`height` or `aspect-ratio`** so the browser reserves space → no layout shift
  (CLS). This is the single most common cause of janky-feeling pages.
- **`loading="lazy"`** on below-the-fold images; the hero/LCP image stays eager and can be preloaded.
- **`decoding="async"`** to keep decoding off the main thread.
- **Right-size**: don't ship a 2000px image into a 400px slot. Use `srcset`/`sizes` for responsive
  delivery. A 200px avatar does not need a 2MB source.
- **Never inline large base64 images into data/DB columns or HTML** — it bloats payloads and can't be
  cached. Upload to storage/CDN and reference the URL.

### Quality & treatment
- **Consistent treatment**: same corner radius, same border/shadow style, same aspect ratios across a
  gallery or card grid. Mixed treatments look chaotic.
- **Real content over stock clichés.** Generic stock-photo people erode trust. If you must use
  placeholders, use tasteful abstract/gradient art or generated initials avatars — not fake smiling
  faces presented as real users.
- **Provide a fallback** for missing images: an initials avatar (`ui-avatars.com` or a local
  generator), a branded placeholder, or a solid tinted block — never a broken-image icon or a dead
  placeholder service.
- **Alt text**: describe meaningful images for screen readers; `alt=""` for purely decorative ones.

### Avatars specifically
- Circle-crop with `object-fit: cover` so non-square sources don't distort.
- Fallback to initials on a brand-tinted background when there's no photo.
- Small display size → small source. A 40px avatar loading a 1MB photo is a bug.

## Logos & brand assets
- Use **official** brand assets at correct proportions with proper clear space. Don't guess a logo
  URL, recolor it unofficially, or stretch it.
- Provide a light-mode and dark-mode logo variant if the mark doesn't work on both backgrounds.

## Favicons & app icons
- Ship a small, local favicon (a 32–64px PNG or SVG), not a giant remote logo fetched on every load.
- Include `apple-touch-icon` (180px) and a web manifest for installable/PWA contexts.
