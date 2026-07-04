# Global UI/UX Kit

> A portable, project-agnostic design system playbook. Copy this whole folder into any new
> project and you have a complete UI/UX foundation: principles, tokens you re-theme in one
> place, component recipes, accessibility rules, references, and ready-to-install Claude skills.
>
> Nothing here is tied to a specific brand, color, or framework. The blue in the examples is a
> placeholder — [`tokens/theme-recipe.md`](tokens/theme-recipe.md) shows how to swap the whole
> palette in five minutes.

## How to use this in a new project

1. **Copy the folder** into the new repo root (keep the name `global-ui-ux/` or rename to `design/`).
2. **Read [`START-HERE.md`](START-HERE.md)** — it has the new-project workflow and a paste-ready kickoff prompt for Claude.
3. **Pick a theme** with [`tokens/theme-recipe.md`](tokens/theme-recipe.md), then drop [`tokens/tokens.css`](tokens/tokens.css) and [`tokens/tailwind.config.template.ts`](tokens/tailwind.config.template.ts) into the app and edit the ~12 seed values.
4. **Install the skills** in [`claude-skills/`](claude-skills/README.md) so Claude applies this standard automatically.
5. Keep the app honest against [`principles/craft-checklist.md`](principles/craft-checklist.md) before every ship.

## What's inside

| Folder | What it gives you |
|---|---|
| [`START-HERE.md`](START-HERE.md) | The workflow + kickoff prompt for a brand-new UI. |
| [`principles/`](principles/) | The non-negotiables: visual craft, UX laws, the pre-ship checklist. |
| [`foundations/`](foundations/) | Color, typography, spacing/layout, elevation+motion, iconography — the raw materials. |
| [`components/`](components/) | Copy-paste recipes for buttons, cards, forms, nav, modals, tables, and every interaction state. |
| [`accessibility/`](accessibility/) | WCAG-aligned checklist: contrast, keyboard, ARIA, focus, motion. |
| [`tokens/`](tokens/) | The re-theme engine: a semantic CSS-variable starter, a Tailwind config mapped to it, and the step-by-step recipe for inventing a new theme/color. |
| [`references/`](references/) | Where to steal taste from (Awwwards etc.) and the tools/libraries to reach for. |
| [`claude-skills/`](claude-skills/) | Installable Claude skills that encode all of the above. |

## The five rules that survive every project

1. **Semantic tokens, never raw hex in components.** A button is `bg-primary`, not `bg-[#2563eb]`. Re-theming is then one file.
2. **Contrast is a hard gate, not a preference.** Body text ≥ 4.5:1, large text/UI ≥ 3:1 — verified in light *and* dark independently.
3. **One primary action per view.** Everything else is visually subordinate.
4. **Design light and dark together.** Dark is not "inverted light" — it's a second first-class theme with its own contrast math.
5. **Motion means something or it's gone.** Animate transform/opacity only, 150–300ms, always respecting `prefers-reduced-motion`.

Everything else in this kit is an elaboration of those five.
