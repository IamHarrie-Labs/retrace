# Retrace frontend

Codex owns the frontend; Claude owns the backend. Earlier backend changes and the API contracts are recorded in [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md).

## Implemented routes

| Route | Purpose |
| --- | --- |
| `/` | Source-based introduction, illustrated process, memory comparison, evidence table and expanding navigation tiles |
| `/demo` | Wallet-free sample: outcomes change advice, then simulated ownership changes access |
| `/devices` | Wallet entry, message sign-in, device list and passport registration |
| `/passport/[id]` | Repair timeline, diagnosis comparison, attributed record form, export and reviewed transfer |
| `/proof` | Live account and network evidence, with loading, empty, error and retry states |
| `/brand` | Reusable SVG logo system and palette downloads |

The application also has branded loading, error and not-found pages.

## Interaction behavior

- Wallet changes remount private views, and stale responses cannot populate another wallet’s view.
- Records use native form validation, field limits, visible labels, declared evidence and optional shared lessons. Retries reuse the same save identifier while the form stays mounted and its contents stay unchanged.
- Diagnosis comparisons run when requested. Adding a record clears the previous comparison.
- Transfers require a recipient review before opening the wallet. The wallet still requires the holder’s approval.
- Registration and transfer retain public submitted digests across reloads. Check-confirmation controls query that transaction rather than submit another one. No serial numbers or private repair notes are stored in browser storage.
- Motion preferences and public transaction recovery use a subscribed browser store with an in-memory fallback when storage is unavailable.
- Requests have deadlines and actionable network errors. Session expiry clears the signed-in frontend state.

## Supplied frontend adaptation

The homepage now ports the user-supplied HTML section tree and its referenced component styles. `src/app/reference-source.css` preserves the adapted rules; `src/app/reference-theme.css` isolates product changes. `scripts/adapt-reference-css.mjs` regenerates the source style port. The replacement wordmark is outlined sans-serif; the earlier R/arrow monogram is retired. See `design/README.md` for the source-to-component map.

## Brand and assets

See [brand.md](brand.md) for design rules and [design/README.md](design/README.md) for asset details. The master vector symbol is `public/brand/retrace-mark.svg`; `public/brand/retrace-logo.svg` is an outlined lockup with no font dependencies. Fonts are bundled locally with licenses. Original laptop artwork is in `public/images/retrace-device.png`.

## Local preview and verification

The frontend preview uses **http://localhost:3002** because port 3000 is serving a different app. Start it with `npm run dev -- --port 3002` if needed.

Production compilation and TypeScript checking use `npm run build`. Frontend sources are checked with ESLint. Browser checks cover the sample’s recommendation and handover states, mobile navigation, wallet entry, malformed-passport recovery, proof and brand screens. Phone and desktop layouts are inspected for overflow and broken images.

No real wallet signing, Mainnet writes or passport transfers were executed by Codex. Authenticated wallet actions still need the holder’s end-to-end validation with Claude’s backend. This is a local implementation, not a hosting deployment.
