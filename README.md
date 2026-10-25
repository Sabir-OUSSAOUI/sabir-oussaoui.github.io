# Sabir Oussaoui - portfolio (HTML · CSS · JavaScript)

A static portfolio in the spirit of the CodeBucks Next.js developer-portfolio template, rebuilt
with plain HTML, CSS and vanilla JavaScript - no framework, no build step.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

Deploy by uploading the folder as-is (GitHub Pages, Netlify, any static host).

## Pages

| File | Content |
| --- | --- |
| `index.html` | Hero (portrait + animated headline), rotating "Let's talk" badge |
| `about.html` | Biography, counters, circular skills map, Experience & Education timelines with scroll rail, teaching & awards |
| `projects.html` | Featured case study + grid (P1-P4) |
| `publications.html` | 13 CV publications with status / theme / year filters, featured papers, conferences list |
| `certificates.html` | 26 certificates (awards, conferences, training, teaching) with category filter and lightbox; images in `images/certificates/` |

## Edit the content

Everything is in **`js/data.js`** - publications, projects, timelines, skills, EN/FR copy.
Pages contain only layout.

- The CV PDF lives in `files/CV_OUSSAOUI.pdf` (`cvFile` in `js/data.js`); replace the file to update the Download CV link.
- Publication statuses: `pub` (published), `accepted` (accepted, in press), `acc` (accepted with revisions), `rev` (under review).

## Features

- Light / dark mode (persisted in `localStorage`, follows system preference by default)
- EN / FR switch (persisted)
- Word-by-word animated headlines, page wipe transition, scroll-reveal, number counters
- Mobile hamburger menu; responsive down to phone width
- `prefers-reduced-motion` respected

## Credits

- Fonts: Montserrat, JetBrains Mono (Google Fonts, OFL).
- Rotating Earth in the Skills section: `images/earth.gif`, supplied by the owner.
- Portrait: supplied by the owner.
- Project figures: `images/projects/`; publication figures: `images/publications/`.

## Still to supply

- Nothing pending.
