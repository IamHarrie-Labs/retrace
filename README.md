# Retrace

**Know what's been tried before you try it again.**

Retrace is repair memory that stays with a device. Owners and technicians record symptoms, diagnostic tests, repairs and whether the fault came back. Retrace uses that history to change its next diagnostic recommendation. When the device is sold, its passport moves to the new owner, and so does access to everything previous repairs taught.

Built for **Total Recall — Tatum × Walrus Memory Hackathon** (Smart Agents for Real Life track).

- **Live app:** _add the deployed URL here_
- **Proof on Mainnet:** `/proof` on the live app shows every Walrus Memory write, its namespace and the Sui checkpoint read through Tatum.
- **Try it without a wallet:** `/demo` walks through the ThinkPad T480 story with memory on and off.
- **Sample passport:** [`0xcf67d39d…bcb3`](https://suiscan.xyz/mainnet/object/0xcf67d39d32099936cf11dd2a756e38513c8d06534467e1281b2878e93b5ebcb3) (Lenovo ThinkPad T480, 4 records, 1 shop-verified)
- **Write-up:** [docs/blog-post.md](docs/blog-post.md) · **Video script:** [docs/demo-script.md](docs/demo-script.md)

## The learning loop

1. A technician replaces the battery. The fault returns after 21 days. That outcome is written to Walrus Memory.
2. Retrace lowers its confidence that the battery is the cause. The next recommendation changes from *"check the battery"* to *"inspect the charging port"*. The UI shows both versions side by side (without memory / with memory), each memory that moved the ranking with its Walrus blob, and a **learning curve**: the weight of every cause after each record.
3. When a repair finally holds, Retrace distils a **lesson** ("on a ThinkPad T480 with this symptom, battery swaps failed and the DC jack fixed it") into a shared namespace. A *brand-new* T480 with no history then opens with *"2 other ThinkPad T480 owners fixed this fault with the charging port"*.
4. The passport is transferred on Sui. Tatum reports the new owner; the new owner sees the history and the revised diagnosis, and the previous owner loses access through the app.

Evidence is weighted by source: only a **technician's tested result** is strong evidence. Owner recollections are labelled *reported*, and a receipt proves work was paid for, not that it worked. A repair shop can **co-sign** a record with its own wallet, which marks it *Verified by &lt;shop&gt;*.

## For owners, buyers and shops

| Who | What they get |
|---|---|
| **Owner** | Register a laptop (catalogue model picker, serial never stored), record history, see the learned diagnosis, follow-up reminders ("did the fix hold?"), export a service book. |
| **Buyer, before buying** | Scan the QR sticker: public summary (owners, repairs, failed fixes, open faults, shop-verified count). The seller can send a 7-day **read-only link** with the full history and diagnosis. |
| **Buyer, at handover** | Open the seller's **claim link**, sign in, claim. The seller sees "the buyer is ready" and transfers in one click. No 66-character address copy-paste. |
| **Repair shop** | Opens an attestation link, sees only that one record, signs it with its wallet. Signature + record fingerprint are stored on Walrus. |

Optional, when Enoki keys are configured: **Sign in with Google** (zkLogin, no wallet install) and **sponsored gas**, so users never need SUI. Sponsorship is restricted server-side to Retrace's own two entry functions.

## Architecture

| Piece | What it does |
|---|---|
| `move/sources/passport.move` (v2) | `DevicePassport` (`key` only, **no `store`**: it can only move through `transfer_passport`, so every ownership change emits an event). A shared **`Registry`** maps each serial hash to one passport: a device can't be re-registered with a clean history. Unit tests in `move/tests` (`sui move test`). |
| Tatum Sui GraphQL (`src/lib/tatum.ts`) | Every chain read: current owner, a wallet's passports, ownership events, registry lookups (dynamic field), SUI balance before minting, checkpoint. Wallet traffic goes through `/api/graphql` (key stays server-side). Throttled with retry/backoff for rate limits. |
| Walrus Memory (`src/lib/memory.ts`) | `retrace-device-<id>` per passport, `retrace-lessons-<family>` for shared lessons, `retrace-attest-<id>` for shop signatures. **Verify against Walrus** cross-checks the index with what Walrus holds; a missing index is rebuilt from Walrus automatically. |
| Index (`src/lib/ledger.ts`) | SQLite: exact ordered timeline, idempotent writes, handovers, attestations, sign-in replay protection, rate limits. Needs a persistent volume in production. |
| Diagnosis engine (`src/lib/diagnose.ts`) | Deterministic: priors × outcome evidence (strong/weak) × symptom cues × cross-device lessons. Lessons are **one vote per wallet**, growing with independent owners and **capped at ×1.35**, so lesson spam can't steer advice. `npm run check:engine`. |
| Access (`src/lib/access.ts`, `auth.ts`, `tokens.ts`) | Wallet proves identity with a single-use, website-bound signed challenge (zkLogin signatures verified via Tatum). Full history is served only to the wallet Tatum reports as owner, or to a holder of that owner's purpose-bound, expiring share link (dies on transfer). |
| Serial privacy (`src/lib/serial.ts`) | Normalized serial → HMAC-SHA256 with a server pepper. A plain hash of a short serial could be brute-forced to link a laptop to a wallet; this can't. |

Deployed Mainnet objects: package `0x6bd1fc51b3fac2ab3d890c005e5de49c7574175e5e3f6ecb44e01555712b0c85`, Registry `0x8333468c83f45d18ad7676c4fa2aeef79393da9704593967d2744076e2a3494d`.

### Pages

| Route | Who it's for |
|---|---|
| `/` | Landing page with live Mainnet numbers |
| `/demo` | The full story with no wallet: diagnosis with and without memory, transfer, lessons |
| `/devices` | Sign in, register a laptop, list your passports |
| `/passport/[id]` | Public summary for anyone; full history, diagnosis, sharing and handover for the owner |
| `/claim/[token]` | Buyer side of a handover |
| `/attest/[token]` | Repair shop co-signs one record |
| `/proof` | Walrus Memory account, namespaces, write count, Tatum checkpoint, "Verify against Walrus" |
| `/privacy` | What is stored, where, and who can read it |
| `/brand` | Wordmark, palette, type and photo credits |

### Trust model (honest version)

Retrace uses Walrus Memory's [multi-tenant pattern](https://docs.wal.app/walrus-memory/sdk/cookbook-multi-tenant): one operator account, one delegate key, many namespaces. Namespaces organise data; **they are not a security boundary**, and the operator can read every namespace. Access control is enforced by the Retrace server, keyed to onchain passport ownership. The passport is the app's record of a device; it does not prove physical possession. Roles and evidence are declared by the holder unless a shop has signed the record. The registry stops duplicate passports, but whoever registers a serial first holds it.

## Run it

Needs Node 24 or newer (the index uses `node:sqlite`).

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

You need:
- `TATUM_API_KEY` from [dashboard.tatum.io](https://dashboard.tatum.io)
- `MEMWAL_ACCOUNT_ID` + `MEMWAL_PRIVATE_KEY` (delegate key) from [memory.walrus.xyz](https://memory.walrus.xyz)
- `NEXT_PUBLIC_RETRACE_PACKAGE_ID` + `NEXT_PUBLIC_RETRACE_REGISTRY_ID`: `cd move && sui client publish` (Mainnet, a little SUI); the Registry is created by `init`
- `SESSION_SECRET` and `SERIAL_PEPPER`: long random strings (keep the pepper stable)
- Optional: `NEXT_PUBLIC_ENOKI_API_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `ENOKI_PRIVATE_KEY` for Google sign-in and sponsored gas

Checks: `npm run check:engine`, `npm run check:core`, `cd move && sui move test`.

Seed demo devices: `node scripts/seed-device.mjs <addrPrefix> <addrSuffix> resolved|story|fresh`.

## Deploy

The app is one Node server plus a SQLite file, so it needs **one machine with a persistent disk** mounted at `RETRACE_DATA_DIR`. Serverless hosts (Vercel, Netlify) will lose the index between requests. Walrus still holds every record and the index rebuilds from it, but sign-in replay protection, handovers and rate limits live in SQLite.

`NEXT_PUBLIC_*` values are inlined into browser code at build time, so pass them as build args, not only as runtime env.

**Fly.io** (config in `fly.toml`):

```bash
fly launch --no-deploy --copy-config
fly volumes create retrace_data --size 1
fly secrets set TATUM_API_KEY=... MEMWAL_ACCOUNT_ID=... MEMWAL_PRIVATE_KEY=... SESSION_SECRET=... SERIAL_PEPPER=...
fly deploy
```

**Docker Compose** (any VPS): `docker compose up -d --build` reads `.env.local` and keeps the index in the `retrace-data` volume.

**Railway / Render:** deploy from the `Dockerfile`, attach a volume at `/app/.data`, add the variables from `.env.example`, and set the `NEXT_PUBLIC_*` ones as build variables too.

The container starts as root only long enough to give the data volume to the `retrace` user, then drops privileges.

Keep `SERIAL_PEPPER` the same across deploys: changing it orphans every registered serial.

## Demo script

The 2–3 minute recorded version, with shot list, is in [docs/demo-script.md](docs/demo-script.md). The full live walkthrough:

1. Wallet A registers a ThinkPad T480 (registry blocks a second passport for the same serial, however it's spelled).
2. Record the symptom, a tested battery replacement that **returned** after 21 days, and a second battery swap that also returned.
3. Diagnose: *without memory* says battery; *with memory* says inspect the charging port, warns not to repeat the battery swap, and the learning curve shows the port overtaking the battery. A shared lesson from another T480 owner adds a capped nudge.
4. A brand-new T480 with no history already opens with what other owners learned.
5. A shares a read-only link with a prospective buyer, then creates a claim link. Wallet B opens it, signs in, claims; A transfers in one click. A now sees only the public summary; B sees everything.
6. B's shop replaces the DC jack and co-signs the record; the 30-day follow-up says resolved, and a lesson is shared for that model.
7. `/proof` shows the memory count, namespaces and the Walrus Memory account; "Verify against Walrus" matches every record.

## Credits

Photos are of real Lenovo ThinkPads, from Unsplash, Wikimedia Commons and CC0 sources; authors and licences are listed in [public/images/photos/CREDITS.md](public/images/photos/CREDITS.md) and on `/brand`. Fonts: Faculty Glyphic (SIL OFL) and Geist (SIL OFL), self-hosted.
