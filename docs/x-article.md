# The third shop shouldn't replace the battery

Most people with a laptop have lived some version of this.

Your MacBook starts charging when it feels like it. You wiggle the cable, it comes on, it goes off. You take it to a repair shop and they tell you it's the battery. You pay for a new one and it works.

Three weeks later it's doing the same thing again.

This time you go somewhere else, maybe because the first shop is far away or you've lost a bit of trust in them. The new technician has never seen your laptop before. They don't know a battery went in last month, and you might not remember to mention it. So they check the obvious thing first, and the obvious thing is the battery. You pay again.

The laptop went through all of that, and none of it was written down anywhere that the next person could see.

I built Retrace to fix that part.

## What it does

Retrace gives a laptop its own repair record. Every time something goes wrong, or something gets fixed, it goes on the record: the symptom, what the technician tested, what they replaced, and whether it held.

When the laptop acts up again, you tell Retrace what's happening and it suggests what to check first. On a laptop with no history, it says the battery, the same as any shop would. On a laptop whose battery was replaced and tested three weeks ago and still failed, the battery drops down the list. It points the technician at the charging port and warns against a third battery.

On every passport page, you can see that answer both ways: once using the laptop's history and once ignoring it. Each record that changed the answer links to where it's stored, so you can check it yourself.

## When you sell it

This is the part I care about most.

Buying a used laptop is mostly guesswork. The seller says it's fine, and you hope they're right. With Retrace, a buyer can scan a sticker on the laptop and see a short summary before they pay: how many owners it's had, how many repairs, whether any fault is still open, and whether any fix failed. The seller can also send a private link that shows the full history for seven days.

When the sale goes through, the seller hands the laptop's record over to the buyer in one click. From then on, the full history opens only for the new owner.

Repair shops can sign the record of a repair they did with their own wallet. A signed record shows which shop stood behind it. It doesn't prove the repair worked, and Retrace says so on the page.

## How it's built

Each laptop gets a passport on Sui Mainnet. The serial number never goes on-chain. Retrace stores a keyed hash of it, so a short serial can't be guessed back out, and the same laptop can't be registered twice with a clean history.

The repair records live on Walrus Memory. Each laptop has its own space there, and so do shop signatures. If my server ever loses its local copy, Retrace rebuilds it from Walrus and checks every shop signature again before showing it.

Tatum is how Retrace reads Sui. Whenever someone opens a passport, Retrace asks Tatum who owns it right now, and only that wallet gets the full history.

Right now there are 22 records saved on Walrus Mainnet.

## What it doesn't do

I'd rather say this plainly than have someone find out later.

Retrace doesn't diagnose your laptop. It ranks what to check, based on what's already happened, and a technician still has to look at it.

Walrus Memory is shared storage. My server is the thing that decides who can read a laptop's history, based on who owns the passport on Sui. I wrote that on the privacy page in plain words, because if you're going to trust a laptop's history, you should know who's guarding it.

## Try it

You can try the example without a wallet at useretrace.xyz/demo. The live proof, with every record on Walrus and the current Sui checkpoint, is at useretrace.xyz/proof.

The code is open at github.com/IamHarrie-Labs/retrace.

I built this for Total Recall, the Tatum and Walrus hackathon. The idea is small. A laptop that remembers what's been tried can save you from paying for the same repair twice.
