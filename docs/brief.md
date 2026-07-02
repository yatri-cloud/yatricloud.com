# Brief — Yatri Cloud UI Redesign

## Product goal
Yatri Cloud helps people **pass cloud certifications** (AWS, Azure, GCP, DevOps, Kubernetes, Terraform) through free practice tests, study guides, exam dumps, video/Udemy courses, community events, and discounted vouchers. Secondary goals: grow the community (reviews, achievements, certified-yatri showcase), enable trainers to publish courses, and sell vouchers via Yatri Store.

## Audience
- **Primary:** cloud-cert aspirants — students, career-switchers, and working professionals preparing for exams.
- **Secondary:** trainers/instructors publishing courses; event organizers, speakers, sponsors, venues; admins.
- **Mindset:** goal-driven, time-pressured, evaluating trust before investing effort/money. Mobile-heavy usage.

## Redesign objective
A **complete visual redesign** that raises Yatri Cloud to a top-tier cloud-SaaS craft standard while keeping its **blue** identity and adding a polished **light/dark** system — with **zero functional change**. It should feel trustworthy, modern, focused, and motivating (see education psychology in [../DESIGN.md](../DESIGN.md) §5b).

## Scope
**In scope:** design tokens, typography, spacing, all components & page layouts, navigation shell, hero/marketing sections, dashboards, forms, empty/loading/error states, motion, light/dark + section banding, accessibility.

**Out of scope (do not touch):** routing, auth (Google OAuth), API/`server.js`, TanStack Query data flow, cart logic, form submission handlers, state management, env/config, business logic.

## Success criteria
- Cohesive system driven by `DESIGN.md` tokens; no ad-hoc hex in components.
- Light **and** dark both pass WCAG AA; section banding reads as intentional.
- Motion present but purposeful and reduced-motion safe.
- All 60+ routes still behave exactly as before (design-only diff).
- Mobile-first, 44px touch targets, no CLS regressions.

## Constraints & inputs
- Keep blue `#007CFF`, Inter Tight, custom `ThemeProvider`, existing token names.
- Craft reference: [Lovable](../reference/moodboards/DESIGN-lovable.md). Rulebook: [UI/UX Pro Max](../.claude/skills/ui-ux-pro-max/SKILL.md).
- Inspiration: awwwards, motionsites.ai, 21st.dev, getdesign.md, aitmpl.com.
