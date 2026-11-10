# Retrace: a laptop should remember what's already been tried

_Built for Total Recall, the Tatum × Walrus Memory hackathon._

Picture a MacBook Pro that only charges when the USB-C cable sits at a certain angle. The first shop swaps the battery. Three weeks later the fault is back. The second shop has no idea what the first one did, so it swaps the battery again.

Nothing about that is unusual. Repair history lives in receipts, in a shop's own ticketing system, or in the memory of whoever owned the laptop last. When the laptop changes hands, or just changes shops, the history doesn't travel with it, so the next person starts from zero and tries the obvious fix again.

Retrace gives the laptop a memory of its own. Every symptom, test, repair and outcome is attached to the device. When a fix fails, the next recommendation changes. When the laptop is sold, the history goes to the new owner.

## What it does

You register a laptop and get a passport: an object on Sui Mainnet holding the make, model and current owner. The serial number never goes on-chain. Retrace stores a keyed HMAC of it, so nobody can brute-force a short serial back out of the hash, and a shared registry stops the same laptop being registered twice with a clean history.

Then you record what happens. "Charging intermittently." "Replaced battery, technician tested." Three weeks later, "fault returned." Each record goes to Walrus Memory in a namespace for that device.

Ask Retrace what to check next and it ranks the likely causes. With no history, the battery comes first, which is what both shops assumed. With the history, the battery drops. A fix that a technician tested and that still didn't hold counts strongly against that cause (its weight is multiplied by 0.25). A fix the owner only remembers counts more weakly (×0.55). After two failed battery swaps, the charging port overtakes the battery, and Retrace says so: inspect the DC jack, and don't replace the battery a third time.

The page shows both answers side by side, without memory and with memory. It also lists every record that moved the ranking, each linked to its Walrus blob. That side-by-side view is the core of the project: you can see the agent change its mind and see why.

## Lessons that travel between laptops

Once a repair holds, the owner can choose to share a lesson: on a MacBook Pro 13 with this symptom, battery swaps failed and replacing the USB-C port fixed it. Lessons go into a shared namespace per device family, with costs, notes and wallet details stripped out.

Another MacBook Pro 13 with no history of its own then opens with something like "2 other owners of this model fixed it at the charging port."

Shared data is an obvious target for abuse, so lessons are deliberately weak:

- Each wallet gets one vote per fix.
- The boost grows only with the number of distinct wallets.
- The boost is capped at ×1.35 however many lessons pile up.

A laptop's own tested history always outweighs what strangers report.

## Where Tatum and Walrus come in

**Walrus Memory** holds everything Retrace learns:

- `retrace-device-<id>` for each passport's records;
- `retrace-lessons-<family>` for shared lessons;
- `retrace-attest-<id>` for repair shops' signatures.

As of writing there are 22 memory writes on Mainnet. They cover 2 laptops on the current contract, plus 2 from my first test deployment that `/proof` still lists but doesn't count. The `/proof` page lists them live. A "Verify against Walrus" button checks the app's local index against what Walrus actually holds. If the index is lost, the records and shop signatures are rebuilt from Walrus, and each signature is checked again before it counts.

**Tatum** is how Retrace reads Sui. Every ownership question goes through Tatum's Sui GraphQL endpoint:

- Who owns this passport right now?
- Which passports does this wallet hold?
- Has this serial been registered already?
- What happened to it on-chain?

So does the checkpoint shown on the landing page. The wallet's own reads go through a server route, which keeps the API key off the client. The access check itself is a Tatum read: full history is served only to the wallet Tatum reports as the current owner.

## Selling the laptop

This is where the idea pays off. A buyer can scan the passport and see a public summary before anything else happens: how many owners, how many repairs, failed fixes, open faults, shop-verified records. The seller can also send a read-only link with the full history, which expires after 1 to 30 days, or immediately when the laptop changes hands.

At handover, the seller makes a claim link. The buyer opens it, signs in, and claims. The seller sees "the buyer is ready" and transfers in one click, so nobody has to copy a 66-character address. The passport has no `store` ability in Move, so it can move only through Retrace's own transfer function, and every ownership change emits an event.

After the transfer, the old owner sees only the public summary. The new owner sees everything, including the diagnosis that already knows not to swap the battery.

Repair shops get their own link: they see only the one record the owner chose, and they sign it with their wallet. The record is then marked "Verified by" that shop, which matters because Retrace weights evidence by source. A shop's tested result is strong evidence. An owner's recollection is labelled "reported", and a receipt proves the work was paid for, not that it worked.

## Being honest about trust

It would be easy to say "everything is on-chain and trustless," and it would be wrong.

Retrace uses Walrus Memory's multi-tenant pattern: one operator account, many namespaces. Namespaces organise the data, but they are not a security boundary, and the operator can read all of them.

Privacy is enforced by the Retrace server. It checks each request against on-chain ownership through Tatum, against a wallet-signed session, or against a share token that is signed, purpose-bound and expiring.

A passport records a device; it doesn't prove anyone is physically holding it. Whoever registers a serial first holds that passport.

I've put all of this on a plain-language privacy page in the app, because people deciding whether to trust a used laptop's history deserve to know exactly what they're trusting.

## How it's built

- **Front end:** Next.js 16 and React 19.
- **Contract:** a Move package on Sui Mainnet.
- **Storage and reads:** Walrus Memory through the relayer, and Tatum for chain reads.
- **Local index:** a small SQLite file holds the ordered timeline, handovers, sign-in replay protection and rate limits.
- **Sign-in:** a wallet-signed challenge that is single-use and bound to the website, then an httpOnly session cookie.
- **Optional:** Google sign-in through zkLogin, and sponsored gas through Enoki, so a buyer never needs to hold SUI.

The diagnosis engine is deterministic: priors multiplied by outcome evidence, symptom cues and capped lessons, then the cheapest test among the near-top causes. No model call decides your repair. It has its own test suite (`npm run check:engine`).

## Try it

- **Live app:** https://useretrace.xyz
- **Mainnet proof:** https://useretrace.xyz/proof
- **No-wallet demo:** https://useretrace.xyz/demo
- **Code:** https://github.com/IamHarrie-Labs/retrace

The live passport on Mainnet happens to be a ThinkPad T480, because Retrace works the same way for any laptop on its list: [`0xcf67d39d…bcb3`](https://suiscan.xyz/mainnet/object/0xcf67d39d32099936cf11dd2a756e38513c8d06534467e1281b2878e93b5ebcb3).

The point of Retrace is small: the third shop shouldn't replace the battery. A laptop that remembers what's been tried can tell it so.
