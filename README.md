# Sabir Oussaoui - portfolio (HTML · CSS · JavaScript)

Live site: **https://sabiroussaoui.me** (custom domain; https://sabir-oussaoui.github.io redirects here)

A static portfolio in the spirit of the CodeBucks Next.js developer-portfolio template, rebuilt
with plain HTML, CSS and vanilla JavaScript - no framework, no build step.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

Deployed with GitHub Pages from the `main` branch of this repository (`sabir-oussaoui.github.io`); every push to `main` updates the live site. The `CNAME` file holds the custom domain `sabiroussaoui.me`; its DNS has the four GitHub Pages A records (185.199.108-111.153).

## Pages

| File | Content |
| --- | --- |
| `index.html` | Hero (portrait + animated headline), rotating "Let's talk" badge |
| `about.html` | Biography, counters, circular skills map, Experience & Education timelines with scroll rail, teaching & awards |
| `projects.html` | Featured case study + grid (P1-P4) |
| `publications.html` | Published and accepted papers with status / theme / year filters, graphical abstracts, featured papers, conferences list |
| `certificates.html` | 27 certificates (awards, conferences, training, teaching) with category filter and lightbox; images in `images/certificates/` |
| `events.html` | Events with photo, date, place, role and description; photo galleries in the lightbox; images in `images/events/` (`events` in `js/data.js`) |
| `references.html` | Professors to contact for a reference: name, status, institution, email and phone (`references` in `js/data.js`) |
| `contact.html` | Contact details and a message form; messages are delivered to sabiroussaoui11@gmail.com through Web3Forms when `web3formsKey` is set in `js/data.js`, otherwise FormSubmit; if the service fails, the visitor gets a pre-filled email link |
| `signature.html` | Email signature (not linked in the menu): preview, one-click copy and setup steps for Gmail and Outlook; photo in `images/signature/` |

## Edit the content

Everything is in **`js/data.js`** - publications, projects, timelines, skills, EN/FR copy.
Pages contain only layout.

- The CV PDF lives in `files/CV_OUSSAOUI.pdf` (`cvFile` in `js/data.js`); replace the file to update the Download CV link.
- Publication statuses: `pub` (published), `accepted` (accepted, in press), `acc` (accepted with revisions), `rev` (under review).

## Updating

After editing `js/data.js`, `js/main.js` or `css/style.css`, bump the `?v=` number on their `<script>`/`<link>` tags in every HTML page so browsers fetch the new version instead of a cached one.

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

## Opening screen

`js/intro.js` (home page only) shows a full-screen opening: the name "Sabir OUSSAOUI" on the left, the portrait (`images/profile/intro-cutout.webp`, background removed) in front of a rotating network globe on the right, over a moving 3D grid that tilts with the cursor, a plain JavaScript port of the "HyperGrid" component. "Enter the portfolio" (or Enter / Escape) fires the warp effect and fades into the site. It shows once per browser session; clicking the name badge in the header (on any page) replays it and returns to Home, and `?intro` in the URL also forces it.

## Cursor effect

`js/splash-cursor.js` adds a fluid "ink" trail that follows the mouse on every page, with a splash on click. It is a plain JavaScript port of the "SplashCursor" WebGL2 fluid simulation, coloured with the site palette (purple `#8B5CF6`, gold `#FBBF24`, lavender `#C4B5FD`). It never blocks clicks, adapts to light mode, and is skipped on touch-only devices and for visitors who prefer reduced motion.

## Navigation

Links between pages are handled in `js/main.js` without a full reload: the new page's `<main>` is fetched and swapped in with a short fade, so the header, background and cursor effect keep running and nothing flashes. Back/forward buttons work, and if anything fails the browser falls back to a normal page load.

## Colours

Dark mode (default): backgrounds `#121212` with a static gradient to `#1E1B26` / `#2A1B38`, cards `#1E1B26`, purple `#8B5CF6` for subheadings, icons and hover, deep purple `#5B21B6` for card shadows and accents, gold `#FBBF24` (with dark text) for main buttons and the active menu item, text `#F8FAFC` and `#94A3B8`. Light mode uses `#F8FAFC` with deep purple accents and the same gold buttons. All colours are CSS variables at the top of `css/style.css`.
