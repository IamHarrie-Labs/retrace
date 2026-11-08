# Retrace demo video: script and shot list

Target length is about 2:40, with a hard ceiling of 3:00. Record at 1440×900 or 1920×1080 in a clean browser profile with no extensions visible. Turn off notifications.

Before recording:

- Open the live site in tabs, in this order: `/`, `/demo`, `/passport/0xcf67d39d32099936cf11dd2a756e38513c8d06534467e1281b2878e93b5ebcb3`, `/proof`, and Suiscan for the same object.
- Load `/proof` once so the numbers are warm.
- Have a wallet signed in that owns no passports. It's only needed for shot 6.

| # | Time | Screen | Say (voice-over) |
|---|---|---|---|
| 1 | 0:00–0:12 | `/` hero. Let the cube turn once. | "A ThinkPad stops charging. The shop replaces the battery. Three weeks later it's back, and the next shop replaces the battery again, because nobody told them." |
| 2 | 0:12–0:25 | Scroll to the live band. Hover over the three numbers. | "Retrace gives the laptop its own repair memory. This is live on Sui Mainnet: repair records stored in Walrus Memory, and the chain read through Tatum." |
| 3 | 0:25–0:50 | `/demo`, step **Meet the device**: the T480, its passport and the "Charges intermittently" symptom. | "Register the laptop and you get a passport on Sui. The serial is never on-chain. Then record what happens: the symptom, a battery swap a technician tested, and the fact that it came back three weeks later." |
| 4 | 0:50–1:25 | Step **Learn from a repair**. Hold on the diagnosis, then switch **Use repair memory** off and on. | "Here's the point. Without memory, Retrace says check the battery, the same as every shop. With memory, a tested fix that didn't hold counts against the battery. The charging port moves to the top, and it warns you not to swap the battery again. Every record that moved the ranking links to its Walrus blob." |
| 5 | 1:25–1:40 | **Only if you've registered a second T480 with no history:** its passport page opening with the shared lesson. Otherwise skip this shot and give the time to shot 4. | "When a fix holds, the owner can share a lesson for that model. A brand-new T480 with no history starts with what other owners learned. It's capped and one vote per wallet, so spam can't steer the advice." |
| 6 | 1:40–2:10 | Step **Pass it forward**: transfer, then switch between Owner A and Owner B. Cut to the real passport page signed in as a wallet that doesn't own it, showing the public summary with records hidden. | "When the laptop is sold, the buyer claims it with a link and the seller transfers in one click. Retrace asks Tatum who owns the passport now. The new owner sees everything. Anyone else, including the old owner, sees only the public summary." |
| 7 | 2:10–2:30 | `/proof`. Click **Verify against Walrus** and wait for the match. Then the Suiscan tab showing Lenovo ThinkPad T480. | "This is the real thing, not a mock: 22 memories on Mainnet, every namespace listed, checked against Walrus, and the passport object on Suiscan." |
| 8 | 2:30–2:42 | Back to `/`, the final call to action. Show the GitHub URL as a lower third. | "Retrace. Know what's been tried before you try it again." |

## Notes for the edit

- Put captions on every line. Judges often watch muted.
- Zoom to 125% or crop in on shot 4. The side-by-side view is the money shot, so give it the most screen time.
- If the live numbers have grown since the script was written, say the number on screen, not "22".
- Don't show `.env.local`, a terminal with keys, or a wallet's recovery screen at any point.
- Keep the trust claim exact: access is enforced by Retrace using on-chain ownership. Don't say "only the owner can decrypt", because Walrus namespaces aren't encrypted per user.

## 30-second cut (for socials)

Shots 1, 4, 7 and 8, trimmed: the problem, memory off versus memory on, the Mainnet proof, and the tagline.
