# Kodaros — Landing Page Showcase

**English** · [Português (Brasil)](README.md)

**50 demo pages, each with its own niche-specific visual identity.**

A project published on GitHub Pages to show real companies how a landing page can be built without a generic template — with a custom palette, hand-picked typography and content written for the business, not for SEO.

The hub follows the Kodaros identity: obsidian, warm ink and a single gold accent, with Instrument Serif for titles and Figtree for body text. Each page's cover is a real screenshot of its top.

## Structure

```
/
├── index.html              ← hub with splash, search, filter, grid and viewer
├── assets/
│   ├── css/
│   │   ├── kit.css         ← shared foundation (grid, typography, components)
│   │   └── hub.css         ← hub styling (Kodaros identity)
│   ├── js/
│   │   └── hub.js          ← hub logic (filter, search, viewer)
│   ├── data/
│   │   └── sites.js        ← manifest with the 50 pages
│   ├── covers/             ← 1440×1080 covers (screenshot of each page's top)
│   └── img/                ← bust, favicon and sharing image
├── sites/
│   ├── <slug>/
│   │   ├── index.html      ← individual page
│   │   ├── style.css       ← niche palette and layout
│   │   └── assets/
│   │       ├── mark.svg    ← brand in SVG
│   │       ├── hero.svg    ← opening artwork
│   │       └── work-*.svg  ← per-section images
│   └── … (50 in total)
├── tools/
│   ├── gen-assets.mjs      ← deterministic SVG generation
│   ├── validate.mjs        ← mechanical validator
│   ├── contrast.mjs        ← WCAG AA contrast audit
│   ├── covers.mjs          ← regenerates the showcase covers
│   └── serve.mjs           ← development server
└── .nojekyll               ← required for GitHub Pages
```

## How to use

### Local server

```bash
node tools/serve.mjs
# opens at http://127.0.0.1:8790/
```

### Validate all pages

```bash
node tools/validate.mjs
# or specific ones:
node tools/validate.mjs estudio-norte saraiva-prado
```

### Audit contrast (WCAG AA)

With the local server running:

```bash
node tools/contrast.mjs
# walks all 50 pages + the hub and exits with code 1 if any text fails
```

### Regenerate the covers

After editing the top of a page:

```bash
node tools/covers.mjs
# rewrites assets/covers/<slug>.webp (1440×1080) for all pages
```

### GitHub Pages

1. Push the repository
2. On GitHub, Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`
3. The `.nojekyll` is already at the root — Jekyll will not be triggered

## Covered niches

| Category | Pages |
|-----------|-------|
| Food | 9 |
| Education | 7 |
| Portfolio | 6 |
| Health | 5 |
| Retail | 5 |
| Fitness | 4 |
| Beauty | 3 |
| Technology | 3 |
| Construction | 3 |
| Pets | 2 |
| Services | 2 |
| Tourism | 1 |

## Rules

- No page uses a ready-made template
- No purple-blue gradient, emoji, or banned font
- No invented data such as "99% satisfaction" or "more than 10,000 clients"
- Client is a real business with an address, price in reais and city
- Skip-link, pt-BR lang, meta description, demo notice and demo chip on all
- No label below 11px; no isolated touch target below 24px
- Everything responds at 390px without horizontal scrolling

---

Created by Kodaros to demonstrate work.
