# Portfolio

Personal portfolio site for **Rylle Airon J. Mantaring** — Computer Engineering student
specializing in Data Science.

Live at <https://ryllelang.github.io/Portfolio/>

Plain HTML, CSS, and JavaScript. No build step, no dependencies, no framework.

```
index.html          all page content
css/styles.css      all styling (theme tokens in the :root block at the top)
js/main.js          nav, mobile menu, scroll reveal, active-link highlighting
assets/             images, resume, and the IEEE paper
tools/              helper script for cropping images to the sizes the page needs
```

## Preview locally

Open `index.html` in a browser. Or, for a proper local server:

```sh
python -m http.server 8000
# then visit http://localhost:8000
```

## Outstanding

**`assets/resume.pdf` is missing.** The `Resume` button in the nav links to it, so that
link 404s until you drop your CV in with exactly that filename. Everything else on the
page is wired up and rendering.

## Adding or replacing images

`tools/prepare-image.ps1` crops and resizes any photo to the exact size a slot needs.
It centre-crops to the right aspect ratio (never squashes), honours EXIF rotation from
phone cameras, and writes straight into `assets/`.

```powershell
.\tools\prepare-image.ps1 -In "C:\path\to\photo.jpg"  -For about
.\tools\prepare-image.ps1 -In "C:\path\to\onsite.jpg" -For experience
.\tools\prepare-image.ps1 -In "C:\path\to\shot.png"   -For project -Name philprop
```

| Flag | Purpose |
| :--- | :--- |
| `-For` | `about` (1000×1000), `experience` (1600×900), `project` (1600×1000) |
| `-Name` | required with `-For project`: `philprop`, `lutong-bahay`, or `messenger-ai` |
| `-Anchor` | `Center` (default), `Top`/`Bottom` when height is trimmed, `Left`/`Right` when width is |
| `-Format` | `auto` (PNG for screenshots, JPEG for photos), or force `jpg`/`png` |
| `-Quality` | JPEG quality, 50–100. Default 88. Ignored for PNG. |

Use `-Anchor Top` if a head gets cropped off. Re-run as often as you like; it overwrites.

## Theming

Every colour, font, and spacing value lives in the `:root` block at the top of
`css/styles.css`. To change the accent colour, edit these three:

```css
--accent:      #2ee6a8;   /* mint green */
--accent-dim:  rgba(46, 230, 168, 0.10);
--accent-soft: rgba(46, 230, 168, 0.28);
```

## Deploying

Pushing to `main` publishes the site. In the repo:
**Settings → Pages → Source `Deploy from a branch`, branch `main`, folder `/ (root)`.**
The first build takes a couple of minutes.

Asset paths in the HTML are relative (`css/styles.css`, `assets/...`), so the site works
from the `/Portfolio/` subdirectory with no extra config. The `og:` tags and
`<link rel="canonical">` are absolute and point at the URL above — note the capital **P**
in `Portfolio`, since GitHub Pages paths are case-sensitive.

## Deliberate choices

- **Facebook is a `<button>`, not a link.** The profile URL contains profanity, so it is
  base64-encoded in `data-fb` and opened by `js/main.js` on click, keeping it out of the
  markup and the browser's hover status bar.
  **This is cosmetic, not secret** — the URL still appears in the address bar once the
  profile opens, and anyone who opens DevTools can decode it. The real fix is renaming the
  profile (Facebook → Settings → Accounts Center → Profiles → Username); after that, swap
  the button back to a plain `<a href>`.
- **References (professors' names and mobile numbers) are not on the site.** Those belong
  on the CV you hand to a recruiter, not on a page scrapers can reach.
- **`.claude/` is gitignored** — local tooling config, not part of the site.
