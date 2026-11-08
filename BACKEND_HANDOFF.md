# Backend handoff to Claude

The user clarified that Claude owns the backend and Codex owns the frontend. Codex has stopped backend changes. Backend edits below were started before that split was clear. Please review/reconcile them with your in-flight work rather than assuming they are final. This file contains no credentials.

## Backend changes made before clarification

- New `src/lib/ledger.ts`: Node 24 built-in SQLite exact event index, pending job IDs, stored receipts, idempotency keys, durable challenge replay protection and rate counters. Defaults to `.data/retrace.sqlite`; production requires a persistent writable data directory (`RETRACE_DATA_DIR`).
- New `src/lib/http.ts`: bounded JSON parsing, same-origin mutation checks, rate limits and sanitized errors.
- New `src/lib/record-input.ts`: record schema and cross-record validation.
- `src/lib/auth.ts` and auth routes: exact website-bound challenge messages, durable nonce consumption, input validation and no-store responses. Frontend signs the challenge exactly as returned and spreads its fields into verification.
- `src/lib/memory.ts`: confirmed records come from the exact ledger, not semantic top-K; records submit a stable idempotency key and persist background job IDs before polling. Legacy import checks the complete blob inventory before accepting recovery and fails closed above 100 records. Known-failed jobs can start a new attempt; pending jobs resume. Please review this migration/storage design.
- Record route: validates follow-ups, reserves an idempotent record, returns confirmed receipt. Optional `shareLesson` defaults false. Sharing failures return a warning after the primary record is saved.
- Diagnosis route: validates family/symptom, allows device-only advice if shared recall is down, and checks fresh owner before returning private evidence.
- Passport and export routes: no-store/private responses; recheck ownership before returning records. Added authenticated JSON service-book export.
- `src/lib/diagnose.ts`: latest follow-up wins independent of input ordering, uses the follow-up's own evidence strength and receipt, clears obsolete return-day values, and caps repeated model lessons to one gentle boost per hypothesis.
- `src/lib/access.ts`: validates IDs, address-owner kind, fresh authorization reads; error helpers re-exported from http.
- Tatum changes are additive to your throttling/checkpoint work: optional `{ fresh: true }` owner reads, bounded pagination of device inventory and event history. Your checkpoint lower bound and throttled transport were retained. The wallet proxy retains the body/origin checks and calls your `tatumFetch`.
- `next.config.ts`: `output: 'standalone'` added for the optional Docker path. New Dockerfile, compose.yaml and .dockerignore have not been container-tested. Compose build should use `docker compose --env-file .env.local up --build` so the public package ID is supplied at build time.
- package.json: Node >=24, @types/node 24, tsx, `check:core` and `check:api` added. `.env.example` documents the data directory and public origin; `.gitignore` ignores private data/backups. `tsconfig.json` excludes old source backups.

## Frontend contract (Codex-owned)

- `src/lib/client-api.ts` is a browser request helper with deadlines and recoverable error messages.
- SessionProvider expects `/api/auth/session` -> `{ address }`, challenge -> `{ message, ...serverFields }`, and verify -> `{ address }`.
- Record forms send the existing fields plus optional `shareLesson`, and an `Idempotency-Key` header. A successful response is `{ record: {blobId,...}, lesson?, warning? }`. Please preserve idempotent behavior even if your persistence design differs.
- The service-book export link targets `/api/passport/:id/export`.
- Diagnosis accepts `{symptom}` and expects `{family,withoutMemory,withMemory,warning?}`.
- Transactions stay in the wallet. The frontend retains submitted digests and waits for `getClient().core.waitForTransaction()` instead of using fixed timers or blindly resubmitting.
- No real wallet transactions or Mainnet writes were initiated by Codex.

## Verification performed

19 isolated core checks passed, including >100-record history, process restart, duplicate saves, nonce replay, real ephemeral-key Sui signatures, follow-up ordering and weak evidence. The existing diagnosis checks passed. Tests use temporary databases and make no network requests or Mainnet writes. `check:api` was authored but has not yet been run; it signs only with an ephemeral in-memory test key and performs read-only chain inventory checks.

Please retain any newer backend changes you made while these files were being edited. Codex is finishing the visual/product frontend only from here.
