# Frontend source adaptation

The current homepage is a React port of the actual HTML pasted by the user, rather than the first redesign that used it only as inspiration. The first design is retained in `design/source-backup/home-first-design.tsx` and `first-logo.svg` for reference.

## Source and implementation map

| Supplied source | Retrace implementation |
| --- | --- |
| `hero-subhero`, `hero`, `hand`, `subhero` | Same section structure and source grid; laptop-specific contour field, product copy and ink controls |
| `service-cards`, `sticky-head`, `cards` | Source component CSS, responsive subgrid, four original device diagrams |
| `case-study`, `categories`, `mocks` | Source placements, with an interactive sample repair-memory comparison |
| `clients-table` | Source layout repurposed as an evidence and storage table |
| `onboarding`, `tile-face`, `split-a`, `split-b` | Source expanding-tile geometry; product navigation replaces the studio contact forms |
| Bordered navigation and line-art footer | Shared application chrome with Retrace routes and the revised vector wordmark |

`design/source-reference/pasted-frontend.html` is the original, inert user-supplied snapshot. Its two referenced stylesheets are preserved beside it. `scripts/adapt-reference-css.mjs` extracts the relevant component rules and responsive queries, remaps generated Svelte scopes for React, and writes `src/app/reference-source.css`. The generated file contains 157 top-level CSS blocks. Product changes are kept separately in `src/app/reference-theme.css`.

No Svelte runtime, studio analytics, tracking identifiers, contact submissions, proprietary fonts or studio logo are executed or included in the runtime bundle. The source snapshot remains documentation only.

## Brand

The primary logo is now a fully outlined sans-serif wordmark with an ochre terminal. The old R/arrow monogram is retired. Download the wordmark and the secondary trace symbol from `/brand`. Assets are reused by the header, footer and favicon, and can be regenerated with `scripts/outline-logo.py`.

See `brand.md` for the revised palette and usage. The original AI laptop image remains available in the wallet-free demo; the homepage now uses code-native contour art and SVG device illustrations.

## Product routes and verification

See `FRONTEND.md` for all routes, transaction recovery, request states and the API expectations shared with Claude. The frontend preview uses http://localhost:3002; port 3000 belongs to another local application.

The first implementation’s production build and route checks passed. The source adaptation is separately checked with ESLint, TypeScript, a production build and browser inspection of desktop and phone layouts, expanding tiles, sample memory, logo reuse and links. No actual wallet signatures, Mainnet writes or real transfers are submitted by Codex.
