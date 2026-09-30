# TM Travel — Inbound Japan Landing Page (React + Vite)

An inbound travel landing page for foreign visitors, based on [tm-travel.co.jp](https://tm-travel.co.jp/).
Built with React 19 and Vite, with 3D scenes in three.js (React Three Fiber). Each language is **prerendered** into its own static HTML page, so search engines can index every language.

## Getting started

Requires **Node.js 20 or newer**.

```bash
npm install
npm run dev        # http://localhost:5173 (also /ja/, /th/, /zh/, /ko/)
npm run build      # production build → dist/  (prerenders one page per language)
npm run preview    # preview the production build
```

## Where to change what

| I want to change… | Edit this file |
|---|---|
| Colors, fonts, spacing, corner radius | `src/styles/tokens.css` |
| Phone, address, logo files, map tour speed, languages, menu items, site URL | `src/config/site.js` |
| Any interface text (headings, buttons, menu labels) | `src/i18n/en.json`, `ja.json`, `th.json`, `zh.json`, `ko.json` |
| A destination (text, photo, category, order, map pin `coords`) | `src/data/destinations/<place>.json` |
| 3D map look (colors, pins, camera) | `src/components/three/JapanMap.jsx` |
| Seasonal particles (petals, fireflies, leaves, snow) | `KINDS` in `src/components/three/SeasonParticles.jsx` |
| Photo tag above the active pin (size, style) | `src/components/three/JapanMap.module.css` |
| Hero photo (only shown in browsers without 3D) | first entry of `src/data/hero.json` |
| Seasons / Experiences | `src/data/seasons.json`, `src/data/experiences.json` |
| "Why us" cards / planning steps | `src/data/features.json`, `src/data/steps.json` (text keys live in `src/i18n`) |
| Destination filter categories | `src/data/filters.json` (labels are `filter.<name>` in `src/i18n`) |
| Photos (Unsplash IDs + photographer credit) | `src/data/photos.json` |
| Section order, or removing a section | `src/App.jsx` |
| Icons | `src/components/ui/icons.js` |
| Logo images | `public/images/logo/` |

## Project structure

```
index.html                      HTML template (placeholders are filled by the prerender step)
vite.config.js
scripts/
├── prerender.js                Writes dist/index.html, dist/th/index.html, … after the build
├── download-images.mjs         Optional: download photos locally
├── build-japan-map.mjs         Makes src/data/japan-map.json (coastline of the 3D map)
└── build-japan-terrain.mjs     Makes src/data/japan-terrain.png (mountains of the 3D map)
src/
├── main.jsx                    Browser entry: hydrates the prerendered page (createRoot in dev)
├── entry-server.jsx            Prerender entry: renderToString(<App lang="…" />)
├── App.jsx                     Assembles the sections
├── config/site.js              Company info, languages, navigation, settings
├── styles/
│   ├── tokens.css              Brand design tokens (navy #171C61, gold #F8B62D)
│   └── global.css              Reset, typography, .container, .section, .reveal
├── i18n/*.json                 One file per language (UI text)
├── data/                       Content: destinations/*.json, hero, seasons, experiences, …
├── lib/
│   ├── i18n.jsx                I18nProvider + useI18n() → { lang, t, tx }
│   ├── paths.js                asset(), localizedHome(), langFromPath()
│   ├── images.js               photoUrl(), photoSrcset(), photoCredits()
│   ├── content.js              Loads and sorts the data files
│   ├── mosaic.js               Destination grid layout logic
│   ├── head.js                 <head> tags per language (SEO, hreflang, fonts)
│   └── cx.js                   className joiner
├── hooks/                      useScrolled, useMediaQuery, useReveal, useDocumentHead,
│                               use3D, useInView, useTilt
└── components/
    ├── three/                  JapanMap (hero map tour) + terrain.js, SeasonParticles — 3D, loaded only when shown
    ├── ui/                     Icon, Button, Eyebrow, SectionHeading
    ├── layout/                 Header, LanguageSwitcher, Footer, BackToTop
    ├── sections/               Hero, Intro, Destinations, Seasons, Experiences, CallToAction
    ├── intro/FeatureCard
    ├── destinations/           DestinationCard, DestinationFilters, DestinationModal
    ├── seasons/SeasonPanel
    ├── experiences/ExperienceCard
    └── cta/StepItem
```

Every component is a `.jsx` file with a matching `.module.css` (CSS Modules), so its styles only affect that component.

## How translations work

```jsx
import { useI18n } from "../../lib/i18n.jsx";

const { lang, t, tx } = useI18n();
t("nav.seasons");      // UI text from src/i18n/<lang>.json
tx(destination.name);  // pick the current language from { en, ja, th, zh, ko }
```

The language comes from the URL (`/`, `/ja/`, `/th/`, …). Missing translations fall back to English.

In `ja.json`, `hero.tagline` and `footer.tagline` are intentionally empty. The brand tagline 旅で 人を つなぐ is already Japanese, so the translation line is hidden there instead of repeating it.

## How prerendering works

`npm run build` runs three steps:
1. `vite build` creates the normal client bundle.
2. `vite build --ssr src/entry-server.jsx` creates a server version of `App`.
3. `scripts/prerender.js` renders `App` once per language to HTML and writes `dist/<lang>/index.html`, including that language's `<title>`, description and hreflang tags.

In the browser, `main.jsx` hydrates that HTML, so the page is readable before JavaScript loads and interactive after. Keep the first render identical on server and client: read browser-only values such as `window` or the current date inside `useEffect`, as `Seasons.jsx` and the hooks do.

## How the 3D works

The 3D parts sit on top of the normal page. All text stays in the HTML, so search engines, translations and screen readers work as before.

- **Hero map tour** (`sections/Hero.jsx` + `components/three/JapanMap.jsx`): a 3D map of Japan behind the hero, with a pin for every destination (`coords` in its JSON file) and gold routes from our home (the destination marked `"home": true`). The camera tours the pins on its own — north to south, ending at our home — and each stop's photo, name and distance from Matsuyama appear together in a tag above its pin. Visitors can click a pin or one of the bars (bottom right) to jump to a stop. Speed: `heroIntervalMs` in `site.js`. The islands are a relief model with real mountains (about 28× taller than life, so the Japan Alps and Mt. Fuji stand out), lit so the relief shows as the camera flies between stops; phones get a lighter version of the same model. The coastline comes from Natural Earth (public domain) and is made by `node scripts/build-japan-map.mjs`; the elevation comes from NOAA ETOPO1 (public domain, ~100 kB) and is made by `node scripts/build-japan-terrain.mjs` (it downloads the data, so it needs internet). Colours and relief height are at the top of `JapanMap.jsx`: `LAND_STYLE` switches between "forest" (green, rocky and snowy peaks) and "sand".
- **Seasonal particles** (`components/three/SeasonParticles.jsx`): cherry petals, fireflies, maple leaves or snow over the Seasons panels, matching the open season.
- **Tilting cards** (`hooks/useTilt.js`): destination and experience cards lean toward the mouse. CSS only, no three.js.

The 3D code (~250 kB gzipped) downloads only after the page is visible and only in browsers with WebGL (`hooks/use3D.js`); other browsers show the first photo from `hero.json`. Scenes pause when scrolled off screen or when the tab is hidden, and visitors who ask for reduced motion get a still map (no automatic tour) and no particles.

## Common tasks

**Add a destination.** Copy `src/data/destinations/nara.json` to a new file and edit it, including `coords` (latitude/longitude, e.g. from Google Maps) for its pin and its stop in the hero map tour. Then add its photo to `src/data/photos.json`. The Unsplash ID is the part after `photo-` in an image URL.

**Hide a destination** without deleting it: add `"hidden": true` to its file.

**Add a language:**
1. Add it to `languages` in `src/config/site.js`.
2. Add `src/i18n/<code>.json`.
3. Add the new code to the texts in `src/data/`. If you skip one, English is shown for it.

The build then produces `/<code>/` automatically.

**Add a section.** Create `src/components/sections/MySection.jsx` and `MySection.module.css`, then add `<MySection />` in `src/App.jsx`. Add `className="reveal"` to anything that should fade in on scroll.

## Photos

All photos are from [Unsplash](https://unsplash.com/license), which allows free commercial use. Photographers are credited in the footer. To host them yourself, run `npm run images:download` and set `imageSource: "local"` in `src/config/site.js`.

> The **Matsuyama & Setouchi** photo is a generic coastal image. Replace it with TM Travel's own photos when you have them.

## Deploy

Build command `npm run build`, output directory `dist`. This works as-is on Netlify, Vercel, Cloudflare Pages or any static host.

- **GitHub Pages project site**: set `base: "/repo-name/"` in `vite.config.js`.
- **Before going live**: set `url` in `src/config/site.js` to the real domain. Canonical and hreflang links use it.
