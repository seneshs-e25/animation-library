# Animation Library

Production-ready motion for enterprise marketing websites, split into three pillars:

- **Interactions**: button hovers, links, icons
- **Animations**: scroll triggers, carousels, pin scrollers
- **Shaders**: GPU-driven heroes and backgrounds

Each component has a live preview, a Customize panel for its props, its source code, and a **Copy prompt** button. The copied prompt contains the full source and the usage with the chosen prop values, ready to paste into a coding agent.

## Develop

```bash
npm install
npm run dev
```

## Adding a component

1. Create the component in `src/registry/<category>/<group>/<name>.tsx`. It must be self-contained: the file is shown verbatim in the Code tab and the prompt.
2. Add an entry to `registry` in `src/registry/index.ts` (slug, title, description, category, group, files, controls).
3. Register its live preview in `src/registry/previews.tsx`.

The sidebar, detail page, Code tab and prompt are generated from the registry entry.

## Motion rules

Components follow the Emil Kowalski animation skills in `.claude/skills` (`animate`, `review-animations`, …):

- Animate `transform` / `opacity` (and `clip-path`) only
- Strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for entering motion, never `ease-in`
- Hover effects gated to real pointers (Tailwind v4 `hover:` does this)
- `prefers-reduced-motion` handled in every component
