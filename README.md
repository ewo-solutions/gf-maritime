# GF Maritime website

Static, dependency-free website built from the [Figma design](https://www.figma.com/design/lfk1FU5bE6ftHUaabwBP9m/GF-Maritime).
Plain HTML, CSS and JavaScript – host the repository root on any static host (e.g. Vercel, Netlify, S3).

## Pages

`index.html` · `who-we-are.html` · `what-we-do.html` · `where-we-are.html` · `useful-links.html` · `talk-to-us.html`
plus `policies.html` (linked from the footer / policy cards).

The Terms and Conditions, Privacy Policy and Cookie Policy are downloadable PDFs in `assets/docs/`, linked from the footer. To update one, replace the PDF with the same filename.

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

The form on `talk-to-us.html` posts to `/api/contact` (`api/contact.js`, a Vercel serverless function) which emails the enquiry to
`operations@gf-maritime.com` through [Resend](https://resend.com), with the visitor's address as Reply-To.
If sending ever fails, the visitor is offered the same message as a ready-to-send email, so nothing is lost.

Set these in Vercel → Project Settings → Environment Variables (then redeploy):

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | yes | Resend API key. Until it is set the form falls back to the visitor's email app. |
| `CONTACT_TO` | no | Recipient, default `operations@gf-maritime.com`. |
| `CONTACT_FROM` | no | Sender, default `GF Maritime Website <website@gf-maritime.com>` – the domain must be verified in Resend. |

Spam protection: hidden honeypot field, minimum fill time, origin check and input limits.
