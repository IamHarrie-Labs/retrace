// Run: node scripts/check-diagnose.ts
// Checks the core learning loop without any network: failed fixes must change the next recommendation.
import assert from "node:assert/strict";
import { diagnose, learningTimeline, lessonBoost } from "../src/lib/diagnose.ts";
import type { RepairRecord } from "../src/lib/records.ts";

let n = 0;
const rec = (p: Partial<RepairRecord>): RepairRecord => ({
  v: 1,
  id: `r${++n}`,
  passportId: "0x1",
  kind: "repair",
  family: "charging",
  action: "x",
  outcome: "pending",
  author: "0xa",
  role: "technician",
  evidence: "tested",
  createdAt: new Date(2026, 0, n).toISOString(),
  ...p,
});

const symptom = "Charges intermittently; stops charging when the cable moves";

// 1. No memory: generic advice points at the battery.
const base = diagnose({ family: "charging", records: [], memory: false, symptom });
assert.equal(base.ranked[0].key, "battery");
console.log("without memory →", base.recommendation.text);

// 2. Two battery replacements that didn't hold (one tested, one owner-reported).
const history = [
  rec({ kind: "symptom", action: "Stops charging when the cable moves" }),
  rec({ hypothesis: "battery", action: "Replaced battery", outcome: "returned", daysUntilReturn: 21 }),
  rec({ hypothesis: "battery", action: "Replaced battery again", outcome: "returned", role: "owner", evidence: "reported" }),
];
const learned = diagnose({ family: "charging", records: history, memory: true, symptom });
console.log("with memory    →", learned.headline);
console.log("               →", learned.recommendation.text);
assert.equal(learned.recommendation.hypothesis.key, "port");
assert.equal(learned.avoid[0].hypothesis.key, "battery");
assert.equal(learned.avoid[0].hypothesis.failedFixes, 2);

// 3. A follow-up overrides a repair's outcome.
const r = rec({ hypothesis: "port", action: "Replaced DC jack", outcome: "pending" });
const fu = rec({ kind: "followup", ref: r.id, action: "No faults after 30 days", outcome: "resolved" });
const fixed = diagnose({ family: "charging", records: [...history, r, fu], memory: true });
assert.equal(fixed.ranked[0].key, "port");
console.log("after DC jack  →", fixed.recommendation.text);

// 4. Weak evidence moves belief less than strong evidence.
const weak = diagnose({ family: "charging", memory: true, records: [rec({ hypothesis: "battery", outcome: "returned", role: "owner", evidence: "reported" })] });
const strong = diagnose({ family: "charging", memory: true, records: [rec({ hypothesis: "battery", outcome: "returned" })] });
const pb = (d: typeof weak) => d.ranked.find((h) => h.key === "battery")!.probability;
assert.ok(pb(weak) > pb(strong));

// 5. Cross-device lessons: one vote per wallet, growing with independent owners, capped.
const lesson = (author: string, passportId: string) => ({ v: 1 as const, kind: "lesson" as const, family: "charging" as const, make: "Lenovo", model: "ThinkPad T480", symptom: "Charging / power", failed: ["battery"], fixedBy: "port", passportId, author, createdAt: new Date(2026, 0, 1).toISOString() });
const portWith = (lessons: ReturnType<typeof lesson>[]) => diagnose({ family: "charging", records: [], lessons, memory: true, symptom }).ranked.find((h) => h.key === "port")!.probability;
const spam = Array.from({ length: 50 }, (_, i) => lesson("0xspammer", `0xp${i}`));
assert.equal(portWith(spam), portWith([lesson("0xspammer", "0xp0")]), "one wallet cannot outvote by posting many lessons");
assert.ok(portWith([lesson("0xa", "0x1"), lesson("0xb", "0x2")]) > portWith([lesson("0xa", "0x1")]), "independent owners count more");
const many = Array.from({ length: 20 }, (_, i) => lesson(`0x${i}`, `0xq${i}`));
assert.equal(lessonBoost(20), 1.35);
assert.equal(portWith(many), portWith(many.slice(0, 3)), "boost is capped");
const cold = diagnose({ family: "charging", records: [], lessons: [lesson("0xa", "0x1"), lesson("0xb", "0x2")], memory: true, symptom });
assert.match(cold.headline, /2 other Lenovo ThinkPad T480 owners/);
console.log("cold start     →", cold.headline);

// 6. Learning timeline: the port overtakes the battery as records arrive.
const tl = learningTimeline("charging", [...history, r, fu], symptom);
assert.equal(tl[0].top, "battery");
assert.equal(tl.at(-1)!.top, "port");
console.log("timeline       →", tl.map((p) => p.top).join(" → "));

console.log("\nall checks passed");
