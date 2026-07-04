# Claude Skills

Installable skills that make Claude apply this whole kit automatically. Two are included:

| Skill | What it does |
|---|---|
| [`ui-ux-pro-max/`](ui-ux-pro-max/) | A large design-intelligence reference: 50+ styles, color/font/product guidance, and a 99-rule UX quality checklist across 10 tech stacks. |
| [`theme-forge/`](theme-forge/) | Generates a complete, contrast-verified theme (tokens for light+dark) from a one-line brief, wired to this kit's `tokens/`. |

## How to install a skill

Claude Code discovers skills placed in a `skills/` directory it's told about. To use these:

**Option A — project-local (recommended for a single project):**
```
cp -r global-ui-ux/claude-skills/ui-ux-pro-max  .claude/skills/
cp -r global-ui-ux/claude-skills/theme-forge     .claude/skills/
```
Then invoke with `/ui-ux-pro-max` or `/theme-forge`, or just describe a UI task — Claude will match
the skill from its `description`.

**Option B — global (available in every project):**
```
cp -r global-ui-ux/claude-skills/ui-ux-pro-max  ~/.claude/skills/
cp -r global-ui-ux/claude-skills/theme-forge     ~/.claude/skills/
```

**Option C — no install:** just tell Claude "read `global-ui-ux/claude-skills/*/SKILL.md` and follow
it." The SKILL.md files are complete, readable references on their own.

## Note on `ui-ux-pro-max`

The included `SKILL.md` is the full reference and checklist — **all of its guidance is usable as-is**.
It also documents an optional Python CLI (`scripts/search.py` + CSV databases) for querying its
palette/font/product datasets. **Those script and data files are not bundled here** (this copy is the
documentation layer). If you want the searchable CLI, get the complete skill package from its original
source and drop `scripts/` + `data/` alongside the `SKILL.md`. Without them, ignore the `python3 …`
commands and use the Quick Reference tables and checklists directly — they're the valuable part.

## How they relate to the rest of this kit

- The **docs** (`principles/`, `foundations/`, `components/`, `accessibility/`) are for humans and for
  Claude to read.
- The **skills** are the same knowledge packaged so Claude *auto-applies* it and can be invoked by name.
- **`theme-forge`** is the bridge to `tokens/` — it outputs values that drop straight into
  `tokens/tokens.css`.

Use both: keep the docs as the source of truth, install the skills so the standard is enforced without
you having to remember to ask.
