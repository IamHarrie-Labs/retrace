// End-to-end check of the seller's side against a running dev server, on Sui Mainnet.
// Usage: node scripts/e2e-seller.mjs <sellerAddressInSuiKeystore> <buyerAddress>
// Signs in, mints a passport, records history, diagnoses, then transfers to the buyer.
// Never prints keys.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [sellerArg, buyerArg] = process.argv.slice(2);
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const PKG = env.NEXT_PUBLIC_RETRACE_PACKAGE_ID;

// --- seller key from the local Sui CLI keystore ---
const keystore = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".sui", "sui_config", "sui.keystore"), "utf8"));
const seller = keystore
  .map((b64) => Buffer.from(b64, "base64"))
  .filter((b) => b[0] === 0)
  .map((b) => Ed25519Keypair.fromSecretKey(b.subarray(1)))
  .find((k) => k.toSuiAddress() === normalizeSuiAddress(sellerArg));
if (!seller) throw new Error("Seller address not found in Sui keystore");
const buyer = normalizeSuiAddress(buyerArg);

const client = new SuiGraphQLClient({
  url: "https://sui-mainnet.gateway.tatum.io/graphql",
  headers: { "x-api-key": env.TATUM_API_KEY },
  network: "mainnet",
});

let cookie = "";
async function api(p, init = {}) {
  const res = await fetch(BASE + p, { ...init, headers: { "content-type": "application/json", cookie, ...(init.headers ?? {}) } });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const body = await res.json();
  if (!res.ok) throw new Error(`${p} → ${res.status} ${body.error}`);
  return body;
}
const step = (s) => console.log(`\n▸ ${s}`);

step("Sign in as seller");
const ch = await api("/api/auth/challenge", { method: "POST", body: JSON.stringify({ address: seller.toSuiAddress() }) });
const { signature } = await seller.signPersonalMessage(new TextEncoder().encode(ch.message));
console.log("  session:", (await api("/api/auth/verify", { method: "POST", body: JSON.stringify({ ...ch, signature }) })).address);

step("Mint passport (Tatum GraphQL builds + executes)");
const tx = new Transaction();
tx.moveCall({
  target: `${PKG}::passport::mint`,
  arguments: [tx.pure.string("laptop"), tx.pure.string("Lenovo"), tx.pure.string("ThinkPad T480"),
    tx.pure.vector("u8", [...Buffer.from("e2e-test-serial-hash-placeholder".padEnd(32, "0")).subarray(0, 32)]), tx.object.clock()],
});
const minted = await client.signAndExecuteTransaction({ transaction: tx, signer: seller, include: { effects: true } });
if (minted.$kind !== "Transaction") throw new Error("Mint failed");
console.log("  tx:", minted.Transaction.digest);
await client.waitForTransaction({ digest: minted.Transaction.digest });

let passportId;
for (let i = 0; i < 10 && !passportId; i++) {
  const { passports } = await api("/api/passports");
  passportId = passports.sort((a, b) => b.createdAtMs - a.createdAtMs)[0]?.id;
  if (!passportId) await new Promise((r) => setTimeout(r, 2000));
}
console.log("  passport:", passportId);

step("Record history (each write waits for Walrus Mainnet)");
const records = [
  { kind: "symptom", family: "charging", action: "Charges intermittently; stops charging when the cable moves", outcome: "pending", role: "owner", evidence: "reported" },
  { kind: "test", family: "charging", hypothesis: "charger", action: "Tried a known-good 65W Lenovo charger, fault persists", outcome: "ruled_out", role: "technician", evidence: "tested", by: "Retrace test bench" },
  { kind: "repair", family: "charging", hypothesis: "battery", action: "Replaced battery with OEM 01AV452", outcome: "returned", daysUntilReturn: 21, costUsd: 65, role: "technician", evidence: "tested", by: "Retrace test bench" },
  { kind: "repair", family: "charging", hypothesis: "battery", action: "Replaced battery again (aftermarket)", outcome: "returned", daysUntilReturn: 9, costUsd: 30, role: "owner", evidence: "reported" },
];
for (const r of records) {
  const t0 = Date.now();
  const { record } = await api(`/api/passport/${passportId}/records`, { method: "POST", body: JSON.stringify(r) });
  console.log(`  ${r.kind.padEnd(7)} ${((Date.now() - t0) / 1000).toFixed(0)}s  blob ${record.blobId}`);
}

step("Diagnose");
const d = await api(`/api/passport/${passportId}/diagnose`, {
  method: "POST", body: JSON.stringify({ symptom: "Charges intermittently; stops charging when the cable moves" }),
});
console.log("  without memory:", d.withoutMemory.recommendation.text);
console.log("  with memory:   ", d.withMemory.headline);
console.log("                 ", d.withMemory.recommendation.text);

step("Transfer passport to buyer");
const t2 = new Transaction();
t2.moveCall({ target: `${PKG}::passport::transfer_passport`, arguments: [t2.object(passportId), t2.pure.address(buyer)] });
const moved = await client.signAndExecuteTransaction({ transaction: t2, signer: seller, include: { effects: true } });
if (moved.$kind !== "Transaction") throw new Error("Transfer failed");
console.log("  tx:", moved.Transaction.digest);
await client.waitForTransaction({ digest: moved.Transaction.digest });
await new Promise((r) => setTimeout(r, 3000));

step("Seller's view after transfer");
const after = await api(`/api/passport/${passportId}`);
console.log("  owner:", after.passport.owner, "| seller authorized:", after.authorized, "| wasOwner:", after.wasOwner, "| records returned:", after.records);
console.log("\nPASSPORT_ID=" + passportId);
