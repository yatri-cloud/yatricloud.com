# Tools & Stack

The reach-for-first toolkit. Opinionated defaults so you're not re-deciding every project.

## Recommended web stack (the modern default)

| Layer | Default pick | Why |
|---|---|---|
| Framework | **React + Vite** (or **Next.js** if you need SSR/SSG/routing-as-files) | Fast, huge ecosystem. Next when SEO/SSR matters. |
| Styling | **Tailwind CSS** | Utility-first pairs perfectly with the token system here. |
| Components | **shadcn/ui** (Radix under the hood) | Accessible, unstyled-then-themed, you own the code. |
| Icons | **Lucide** | Clean, consistent, huge set, tree-shakeable. |
| Animation | **Framer Motion** (a.k.a. `motion`) | Declarative, respects reduced-motion, spring physics. |
| Fonts | **@fontsource** (self-hosted) | No render-blocking Google Fonts; preload critical weights. |
| Forms | **react-hook-form** + **zod** | Performant + typed schema validation. |
| Data | **TanStack Query** | Caching, loading/error states for free. |
| Charts | **Recharts** / **visx** / **Tremor** | Recharts for quick, visx for custom, Tremor for dashboards. |

For non-React: Vue + Nuxt UI, Svelte + Skeleton, or plain HTML + Tailwind all map cleanly to the same
token system.

## Design & handoff tools

- **Figma** — design, prototype, inspect. Even devs benefit from roughing layouts here first.
- **Realtime Colors** / **Leonardo** — palette generation with live contrast.
- **Excalidraw / tldraw** — fast wireframes and flow diagrams.
- **Polypane / Responsively** — test many viewports + a11y at once.

## QA & audit tools

- **Lighthouse** (Chrome DevTools) — performance, accessibility, best-practices, SEO. Run it every
  project; target 90+.
- **axe DevTools** / **WAVE** — deeper accessibility auditing.
- **Chrome DevTools → Rendering** — emulate `prefers-reduced-motion`, `prefers-color-scheme`, vision
  deficiencies (test colorblind safety here).
- **Contrast checkers** — DevTools inspector, Stark, `contrast-ratio.com`.

## Performance defaults (they're also UX)

- Self-host fonts; preload the 1–2 above-the-fold weights; `font-display: swap`.
- Modern image formats (WebP/AVIF); set `width`/`height`; `loading="lazy"` below the fold.
- Code-split by route (`React.lazy` / dynamic import); lazy-load heavy non-hero components.
- Defer third-party scripts (analytics, chat, payment SDKs) to idle or first interaction — keep them
  off the critical path.
- Reserve space for async content (skeletons) → CLS < 0.1.
- Target: Lighthouse **Performance 90+, Accessibility 100, Best-Practices 100, SEO 100**.

## Security & privacy hygiene (best practice, quick wins)

- Security headers on every response: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` disabling unused APIs (camera/mic/geolocation).
- Never expose personal data (email, phone, address) in public API responses — request only the
  columns a public view needs; enforce it server-side (row/column security), not just client-side.
- Credentials only in git-ignored env files; never hardcode or paste keys into code or chat.
- Don't inline large base64 blobs into DB columns or HTML — use storage/CDN + URLs.

## File/folder conventions

- Keep this `global-ui-ux/` kit in the repo (or a shared dotfiles/templates repo) and copy it into
  new projects.
- Put the live design decisions for *this* project in a `DESIGN.md` at the repo root that references
  this kit — the kit is the reusable theory, `DESIGN.md` is the project-specific application.
