# Production Project Scaffold — kickoff prompt

A reusable prompt to give an AI (Claude/etc.) at the very start of a new project. It produces a
**production-level folder structure + tooling**, not a toy `create-app` dump. Fill in the bracketed
lines, paste, send.

Pairs with this kit: after scaffolding, use [`START-HERE.md`](START-HERE.md) for the UI/design layer.

---

## THE PROMPT (copy from here)

```
You are setting up a NEW production-grade project. Before writing code, propose the plan, then
scaffold it. Optimize for maintainability, security, and a clean path to production — not the
fastest possible hello-world.

## Project
- Name: [my-app]
- One-line description: [what it does]
- Type: [marketing site / SaaS web app / dashboard / e-commerce / API service / mobile app / CLI / library]
- Stack: [e.g. React + Vite + TypeScript + Tailwind; or Next.js; or Node + Express; or FastAPI]
  (If I didn't specify, recommend a modern default for the type and explain why in one line.)
- Backend / data: [none / Supabase / Postgres+Prisma / Firebase / REST API / describe]
- Deploy target: [Vercel / Netlify / Cloudflare / AWS / Docker / describe]
- Team size: [solo / small team] and whether this is [a throwaway prototype / meant to last]

## Do this in order

### 1. Plan first (don't scaffold yet)
Show me:
- The proposed folder structure as a tree, with a one-line comment on what each top-level folder holds.
- The key config/tooling choices and why (linter, formatter, test runner, CI, package manager).
- Anything about my request that's ambiguous or that you'd decide differently — ask before building.
Wait for my "go" if any choice is non-obvious; otherwise proceed.

### 2. Scaffold the structure
Create a clean, conventional layout for the stack. Requirements:
- Separate concerns: UI/components, routes/pages, business logic/services, data/API layer,
  hooks/utils, types, config, assets, tests. No 500-line god-files, no logic in components.
- A `src/` root (or the stack's convention). Feature-based grouping over type-based once it grows.
- Barrel/index files only where they help; avoid circular imports.
- Include a `docs/` folder and a real `README.md` (see below).

### 3. Tooling & quality gates (the part that makes it "production")
Set up and wire these so they actually run:
- **TypeScript** in strict mode (`strict: true`) if applicable — and make sure the typecheck command
  actually checks the code (verify it, don't assume).
- **Linter + formatter**: ESLint + Prettier (or Biome). A single `npm run lint` and `npm run format`.
- **Pre-commit hook** (husky + lint-staged, or simple git hook) running lint + typecheck on staged files.
- **Testing**: a test runner set up (Vitest/Jest/Playwright as fits) with one example unit test and
  one example integration/e2e test that pass.
- **CI**: a `.github/workflows/ci.yml` that on push/PR runs install → typecheck → lint → test → build.
  It must fail the build on any error.
- **Scripts** in package.json: `dev`, `build`, `preview/start`, `lint`, `format`, `typecheck`, `test`.
- A `.env.example` with every variable documented (names only, no secrets). Real `.env` is git-ignored.

### 4. Production concerns baked in from day one
- **Secrets**: only in git-ignored env files. Never hardcode keys or paste them into code. `.gitignore`
  covers `.env*`, build output, `node_modules`, editor/OS cruft.
- **Config**: a typed, validated config/env module (e.g. zod-parsed `env.ts`) — fail fast on missing vars.
- **Error handling**: a consistent error/loading/empty-state pattern for data; an error boundary for UI;
  structured error responses for APIs. No silent catches that swallow failures.
- **Logging**: a single logger (not scattered console.logs) with levels.
- **Security headers** (web): nosniff, frame-options SAMEORIGIN, referrer-policy, HSTS,
  permissions-policy — in the deploy config.
- **Performance**: code-splitting by route, lazy-load heavy/below-fold modules, self-hosted fonts,
  image dimensions set, third-party scripts deferred.
- **Accessibility**: semantic HTML, keyboard-reachable, visible focus, labels on inputs — as a default,
  not a later pass.
- **SEO/meta** (public web): title/description/OpenGraph, favicon, sitemap, robots.

### 5. Documentation
- **README.md**: what it is, prerequisites, `git clone` → run in <5 steps, the script list, folder-map,
  deploy steps, and a "conventions" section (how we name things, where things go).
- **docs/**: an `ARCHITECTURE.md` (how the pieces fit + data flow) and a `CONTRIBUTING.md` (branch
  naming, commit style, PR checklist). Keep them short and real.
- If this repo will use my `global-ui-ux/` design kit, reference it from the README and put the live,
  project-specific design decisions in a root `DESIGN.md`.

### 6. First commit
- `git init`, a sensible `.gitignore`, and one clean initial commit ("chore: scaffold project").
- Do NOT commit any secret, build artifact, or `node_modules`.

## Ground rules
- Explain your structure choices briefly; don't over-engineer for a solo prototype, don't under-build
  for something meant to last — match the depth to what I said in "Team size".
- Prefer boring, well-supported tools over trendy ones.
- Every command you add must actually work — run/verify the dev server, typecheck, lint, and build
  before telling me it's done. Report what you verified.
- Keep the initial scaffold runnable end-to-end: I should be able to clone, install, and `npm run dev`
  with zero manual fixups.
```

---

## Reference: what a good production structure looks like

A typical **React + Vite + TS + Tailwind** app (adapt names to your stack):

```
my-app/
├── .github/workflows/ci.yml        # typecheck + lint + test + build on every push/PR
├── .env.example                    # documented env vars (no secrets)
├── .gitignore                      # .env*, dist, node_modules, .DS_Store…
├── .eslintrc / eslint.config.js
├── .prettierrc
├── README.md                       # run in <5 steps, scripts, folder map, deploy
├── DESIGN.md                       # project design decisions (references global-ui-ux/)
├── index.html
├── package.json                    # dev build preview lint format typecheck test
├── tsconfig.json                   # strict: true (and verify typecheck really checks!)
├── tailwind.config.ts
├── vite.config.ts
├── docs/
│   ├── ARCHITECTURE.md
│   └── CONTRIBUTING.md
├── public/                         # static assets, favicon, fonts, robots.txt
└── src/
    ├── main.tsx                    # entry
    ├── App.tsx                     # router / shell
    ├── index.css                   # tokens + tailwind (from global-ui-ux/tokens/)
    ├── config/
    │   └── env.ts                  # zod-validated env; fails fast on missing vars
    ├── routes/  (or pages/)        # one folder per route, lazy-loaded
    ├── features/                   # feature-based modules (auth/, billing/, …)
    │   └── <feature>/{components,hooks,api,types}.ts
    ├── components/
    │   ├── ui/                     # primitives: Button, Input, Card (shadcn-style)
    │   └── layout/                 # Navbar, Footer, Sidebar, containers
    ├── lib/  (or services/)        # API clients, business logic, integrations
    ├── hooks/                      # shared React hooks
    ├── utils/                      # pure helpers
    ├── types/                      # shared TS types
    ├── assets/                     # imported images/svgs
    └── __tests__/  (or *.test.ts)  # colocated or central tests
```

**Node/Express API** variant: `src/{routes,controllers,services,models,middleware,config,utils}` +
`tests/`, plus a `Dockerfile` and healthcheck endpoint.

## Why type-based → feature-based
Start type-based (`components/`, `hooks/`, `utils/`) for small apps. Once a feature spans many files,
group by **feature** (`features/billing/{components,hooks,api,types}`) so related code lives together
and can be understood or deleted as a unit. Don't scatter one feature across six top-level folders.

## The one rule that keeps it production-grade
**Quality gates that actually run.** A folder structure is cosmetic; what makes a project
production-level is that `typecheck + lint + test + build` run on every commit and *fail* on error.
Set that up first — the structure serves the gates, not the other way around.
