// Seed realistic demo passports on Sui Mainnet (v2 package) with history on Walrus Memory.
// Usage: node scripts/seed-device.mjs <ownerAddressPrefix> <ownerAddressSuffix> <scenario>
//   scenario "resolved": fault fixed by the DC jack, shop-verified, lesson shared with other owners
//   scenario "story":    two battery fixes failed; DC jack replaced, outcome not known yet (follow-up due)
//   scenario "fresh":    newly registered, no history (shows learning from other owners)
// The owner key is read from the local Sui CLI keystore and never printed. Passports stay with that owner.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { Transaction } from "@mysten/sui/transactions";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [prefix, suffix, scenario = "resolved"] = process.argv.slice(2).map((s) => s.toLowerCase());
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const PKG = env.NEXT_PUBLIC_RETRACE_PACKAGE_ID, REGISTRY = env.NEXT_PUBLIC_RETRACE_REGISTRY_ID;

const keystore = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".sui", "sui_config", "sui.keystore"), "utf8"));
const owner = keystore
  .map((b64) => Buffer.from(b64, "base64"))
  .filter((b) => b[0] === 0)
  .map((b) => Ed25519Keypair.fromSecretKey(b.subarray(1)))
  .find((k) => k.toSuiAddress().startsWith(prefix) && k.toSuiAddress().endsWith(suffix));
if (!owner) throw new Error("Owner address not found in Sui keystore");

const client = new SuiGraphQLClient({ url: "https://sui-mainnet.gateway.tatum.io/graphql", headers: { "x-api-key": env.TATUM_API_KEY }, network: "mainnet" });

function session() {
  let cookie = "";
  return async function api(p, init = {}) {
    const res = await fetch(BASE + p, { ...init, headers: { "content-type": "application/json", origin: BASE, cookie, ...(init.headers ?? {}) } });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const body = await res.json();
    if (!res.ok) throw new Error(`${p} → ${res.status} ${body.error}`);
    return body;
  };
}
const api = session();
const step = (s) => console.log(`\n▸ ${s}`);

step(`Sign in (${scenario})`);
const ch = await api("/api/auth/challenge", { method: "POST", body: JSON.stringify({ address: owner.toSuiAddress() }) });
const { signature } = await owner.signPersonalMessage(new TextEncoder().encode(ch.message));
console.log("  session:", (await api("/api/auth/verify", { method: "POST", body: JSON.stringify({ ...ch, signature }) })).address);

step("Keyed serial hash + registry pre-check (via Tatum)");
const serial = `PF-DEMO-${scenario.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
const { hash, registered } = await api("/api/serial", { method: "POST", body: JSON.stringify({ make: "Lenovo", serial }) });
if (registered) throw new Error("Serial already registered: " + registered);

step("Mint passport via Tatum");
const before = new Set((await api("/api/passports")).passports.map((p) => p.id));
const tx = new Transaction();
tx.moveCall({
  target: `${PKG}::passport::mint`,
  arguments: [tx.object(REGISTRY), tx.pure.string("laptop"), tx.pure.string("Lenovo"), tx.pure.string("ThinkPad T480"),
    tx.pure.vector("u8", [...Buffer.from(hash, "hex")]), tx.object.clock()],
});
const minted = await client.signAndExecuteTransaction({ transaction: tx, signer: owner, include: { effects: true } });
if (minted.$kind !== "Transaction") throw new Error("Mint failed");
console.log("  tx:", minted.Transaction.digest);
await client.waitForTransaction({ digest: minted.Transaction.digest });

let passportId;
for (let i = 0; i < 15 && !passportId; i++) {
  passportId = (await api("/api/passports")).passports.find((p) => !before.has(p.id))?.id;
  if (!passportId) await new Promise((r) => setTimeout(r, 2000));
}
if (!passportId) throw new Error("New passport not visible yet");
console.log("  passport:", passportId);

const dup = await api("/api/serial", { method: "POST", body: JSON.stringify({ make: "lenovo", serial: serial.toLowerCase().replace(/-/g, " ") }) });
console.log("  duplicate check for the same serial, respelled:", dup.registered === passportId ? "blocked ✓" : "NOT DETECTED ✗");

async function save(r) {
  const t0 = Date.now();
  const out = await api(`/api/passport/${passportId}/records`, { method: "POST", body: JSON.stringify(r) });
  console.log(`  ${r.kind.padEnd(8)} ${((Date.now() - t0) / 1000).toFixed(0)}s  blob ${out.record.blobId}${out.lesson ? "  + lesson shared" : ""}${out.warning ? "  ! " + out.warning : ""}`);
  return out.record;
}
const bench = "Ikeja Laptop Clinic";

if (scenario === "resolved") {
  step("History");
  await save({ kind: "symptom", family: "charging", action: "Battery shows 'plugged in, not charging' unless the cable is held at an angle", outcome: "pending", role: "owner", evidence: "reported" });
  await save({ kind: "repair", family: "charging", hypothesis: "battery", action: "Replaced internal battery (OEM 01AV452)", outcome: "returned", daysUntilReturn: 14, costUsd: 70, role: "technician", evidence: "tested", by: bench });
  const jack = await save({ kind: "repair", family: "charging", hypothesis: "port", action: "Replaced DC power jack; solder joints on the old jack were cracked", outcome: "pending", costUsd: 45, role: "technician", evidence: "tested", by: bench });

  step("Shop co-signs the DC jack repair with its own wallet");
  const shop = new Ed25519Keypair();
  const { token } = await api(`/api/passport/${passportId}/attest-link`, { method: "POST", body: JSON.stringify({ recordId: jack.id }) });
  const anon = session();
  const { message } = await anon("/api/attest", { method: "POST", body: JSON.stringify({ token, shop: bench, address: shop.toSuiAddress(), prepare: true }) });
  const sig = await shop.signPersonalMessage(new TextEncoder().encode(message));
  const att = await anon("/api/attest", { method: "POST", body: JSON.stringify({ token, shop: bench, address: shop.toSuiAddress(), signature: sig.signature }) });
  console.log("  attested by", bench, "· blob", att.blobId);

  step("30-day follow-up, lesson shared");
  await save({ kind: "followup", family: "charging", ref: jack.id, action: "30-day check: charging stable at any cable angle", outcome: "resolved", role: "technician", evidence: "tested", by: bench, shareLesson: true });
} else if (scenario === "story") {
  step("History");
  await save({ kind: "symptom", family: "charging", action: "Charges intermittently; stops charging when the cable moves", outcome: "pending", role: "owner", evidence: "reported" });
  await save({ kind: "test", family: "charging", hypothesis: "charger", action: "Tried a known-good 65W Lenovo charger; fault persists", outcome: "ruled_out", role: "technician", evidence: "tested", by: bench });
  await save({ kind: "repair", family: "charging", hypothesis: "battery", action: "Replaced battery with OEM 01AV452", outcome: "returned", daysUntilReturn: 21, costUsd: 65, role: "technician", evidence: "tested", by: bench });
  await save({ kind: "repair", family: "charging", hypothesis: "battery", action: "Replaced battery again (aftermarket)", outcome: "returned", daysUntilReturn: 9, costUsd: 30, role: "owner", evidence: "reported" });
}

{
  step("Diagnose");
  const d = await api(`/api/passport/${passportId}/diagnose`, { method: "POST", body: JSON.stringify({ symptom: "Stops charging when the cable moves" }) });
  console.log("  with memory:", d.withMemory.headline);
  console.log("  lessons used:", d.withMemory.lessonsUsed.length, d.withMemory.lessonsUsed[0] ? `(×${d.withMemory.lessonsUsed[0].boost} from ${d.withMemory.lessonsUsed[0].independentReports})` : "");
  console.log("  timeline:", d.timeline.map((p) => p.top).join(" → "));
}
console.log("\nPASSPORT_ID=" + passportId);
