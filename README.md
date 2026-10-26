# GF Maritime website

Static, dependency-free website built from the [Figma design](https://www.figma.com/design/lfk1FU5bE6ftHUaabwBP9m/GF-Maritime).
Plain HTML, CSS and JavaScript – host the repository root on any static host (e.g. Vercel, Netlify, S3).

## Pages

`index.html` · `who-we-are.html` · `what-we-do.html` · `where-we-are.html` · `useful-links.html` · `talk-to-us.html`
plus `policies.html` and `legal.html` (linked from the footer / policy cards).

## Editing

Pages are generated from `src/` so the header, menu and footer stay identical everywhere:

```
src/layout.html      shared shell (head, curtain, header, menu, footer)
src/partials/        reusable sections (e.g. the Panama gateway + maps)
src/pages/*.html     page content – line 1 is a JSON comment with title/description/nav
```

After editing anything in `src/`, run `node scripts/build.mjs` (Node 18+) and commit the regenerated root `.html` files.
Styles live in `assets/css/styles.css`, behaviour in `assets/js/main.js`.

## Motion & accessibility

- Curtain loader on first visit, quick curtain wipe between pages, scroll reveals, hero parallax, full-screen menu with site search.
- All motion is disabled for `prefers-reduced-motion`; the page works without JavaScript (the curtain only appears when JS is running, with a timed fail-safe).
- Tabs, menu and form are keyboard accessible (arrow keys on tabs, Esc closes the menu, focus is trapped while it is open).

## Contact form

With no backend configured the form opens the visitor's email app with the enquiry pre-filled (to `operations@gf-maritime.com`).
To post enquiries to a form service instead, set `data-endpoint="https://…"` on `#contact-form-el` in `src/pages/talk-to-us.html` (it receives JSON).
