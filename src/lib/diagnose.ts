// Deterministic diagnostic engine. Pure: shared by server and tests.
import type { Evidence, Family, Lesson, Outcome, RepairRecord, Role } from "./records";

export type Hypothesis = {
  key: string;
  label: string;
  /** What to do to check it, cheapest first. */
  check: string;
  /** What fixing it usually involves. */
  fix: string;
  prior: number;
  /** Rough cost of testing it, used to break near-ties. */
  testCost: 1 | 2 | 3;
};

export const FAMILIES: Record<Family, { label: string; examples: string; hypotheses: Hypothesis[] }> = {
  charging: {
    label: "Charging / power",
    examples: "not charging, charges intermittently, battery drains, won't power on",
    hypotheses: [
      { key: "battery", label: "Worn battery", check: "Read battery health and cycle count; run on AC with the battery removed.", fix: "Replace the battery.", prior: 0.32, testCost: 1 },
      { key: "charger", label: "Faulty charger or cable", check: "Try a known-good charger of the correct wattage.", fix: "Replace the charger or cable.", prior: 0.24, testCost: 1 },
      { key: "port", label: "Loose or damaged charging port (DC jack / USB-C)", check: "Inspect the port; wiggle-test the plug while watching the charge LED.", fix: "Re-solder or replace the DC jack / USB-C port.", prior: 0.2, testCost: 2 },
      { key: "board", label: "Charging circuit on the motherboard", check: "Measure input voltage at the board and the charge IC rails.", fix: "Board-level repair of the charging circuit.", prior: 0.14, testCost: 3 },
      { key: "firmware", label: "BIOS / embedded controller firmware", check: "Update BIOS and reset the embedded controller.", fix: "Firmware update or EC reset.", prior: 0.1, testCost: 1 },
    ],
  },
  thermal: {
    label: "Overheating / shutdowns",
    examples: "hot, loud fan, sudden shutdowns, throttling",
    hypotheses: [
      { key: "dust", label: "Dust-blocked heatsink", check: "Open and inspect the heatsink fins and vents.", fix: "Clean the cooling path.", prior: 0.34, testCost: 1 },
      { key: "paste", label: "Dried thermal paste", check: "Compare CPU idle vs load temperatures.", fix: "Repaste CPU/GPU.", prior: 0.24, testCost: 2 },
      { key: "fan", label: "Failing fan", check: "Check fan RPM readings and listen for bearing noise.", fix: "Replace the fan.", prior: 0.2, testCost: 1 },
      { key: "software", label: "Runaway software load", check: "Check CPU usage at idle; boot a clean OS from USB.", fix: "Remove the offending software or reinstall.", prior: 0.12, testCost: 1 },
      { key: "board", label: "Power delivery fault on the motherboard", check: "Log shutdown events against temperature; inspect VRMs.", fix: "Board-level repair.", prior: 0.1, testCost: 3 },
    ],
  },
  display: {
    label: "Display",
    examples: "flicker, black screen, lines, dim screen",
    hypotheses: [
      { key: "cable", label: "Display cable / hinge wear", check: "Flex the lid slowly while watching for flicker.", fix: "Replace the display cable.", prior: 0.32, testCost: 1 },
      { key: "panel", label: "Failing panel", check: "Connect an external monitor; if it is fine, suspect the panel.", fix: "Replace the panel.", prior: 0.28, testCost: 1 },
      { key: "backlight", label: "Backlight failure", check: "Shine a torch at the screen to look for a faint image.", fix: "Backlight / LED driver repair.", prior: 0.16, testCost: 2 },
      { key: "gpu", label: "Graphics chip or driver", check: "Update/rollback drivers; check the external monitor for artefacts.", fix: "Driver fix or board repair.", prior: 0.14, testCost: 2 },
      { key: "firmware", label: "Firmware / OS settings", check: "Reset display settings; update BIOS.", fix: "Settings or firmware update.", prior: 0.1, testCost: 1 },
    ],
  },
};

/** Words in today's symptom that point at a cause. */
const SYMPTOM_CUES: Record<Family, { pattern: RegExp; hypothesis: string; factor: number }[]> = {
  charging: [
    { pattern: /cable moves|wiggl|angle|loose|plug moves|only at certain/, hypothesis: "port", factor: 1.5 },
    { pattern: /drain|holds? (no|little) charge|dies quickly|swollen/, hypothesis: "battery", factor: 1.5 },
    { pattern: /after (an? )?update|bios/, hypothesis: "firmware", factor: 1.5 },
  ],
  thermal: [
    { pattern: /grind|rattl|click|fan (stopped|not spinning)/, hypothesis: "fan", factor: 1.5 },
    { pattern: /idle/, hypothesis: "software", factor: 1.4 },
  ],
  display: [
    { pattern: /open|lid|hinge|angle/, hypothesis: "cable", factor: 1.5 },
    { pattern: /external (monitor|display).*(also|too)|both screens/, hypothesis: "gpu", factor: 1.6 },
  ],
};

/** How much one record should move belief, by who says it and how. */
export function weight(role: Role, evidence: Evidence): "strong" | "weak" {
  return role === "technician" && evidence === "tested" ? "strong" : "weak";
}

const MULT: Record<Exclude<Outcome, "pending">, { strong: number; weak: number }> = {
  returned: { strong: 0.25, weak: 0.55 }, // a fix that didn't hold is evidence against that cause
  ruled_out: { strong: 0.15, weak: 0.5 },
  resolved: { strong: 4, weak: 2 },
  confirmed: { strong: 3, weak: 1.6 },
};

export type Effect = {
  recordId: string;
  hypothesis: string;
  outcome: Outcome;
  strength: "strong" | "weak";
  factor: number;
  summary: string;
  blobId?: string;
};

export type Ranked = Hypothesis & { probability: number; failedFixes: number; evidence: Effect[] };

export type Diagnosis = {
  family: Family;
  memory: boolean;
  ranked: Ranked[];
  recommendation: { action: "check" | "fix"; hypothesis: Ranked; text: string };
  avoid: { hypothesis: Ranked; text: string }[];
  lessonsUsed: (Lesson & { boost: number; independentReports: number })[];
  headline: string;
};

/** Latest outcome per repair (followups override the repair they reference). */
export function effectiveRecords(records: RepairRecord[]): (RepairRecord & { outcomeRecordId?: string; outcomeBlobId?: string })[] {
  const byId = new Map(records.map((r) => [r.id, { ...r }]));
  const latest = new Map<string, RepairRecord>();
  for (const r of [...records].sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))) {
    if (r.kind !== "followup" || !r.ref) continue;
    const target = byId.get(r.ref);
    if (target?.kind === "repair" && target.family === r.family && r.createdAt >= target.createdAt) latest.set(r.ref, r);
  }
  return [...byId.values()].filter(r=>r.kind!=="followup").map(record=>{
    const followup=latest.get(record.id);
    return followup ? { ...record, outcome:followup.outcome, daysUntilReturn:followup.outcome==="returned"?followup.daysUntilReturn:undefined,
      role:followup.role,evidence:followup.evidence,outcomeRecordId:followup.id,outcomeBlobId:followup.blobId } : record;
  });
}

export function diagnose(input: {
  family: Family;
  records: RepairRecord[];
  lessons?: Lesson[];
  memory: boolean;
  /** Today's symptom description. Applies in both modes: it's the present, not memory. */
  symptom?: string;
}): Diagnosis {
  const fam = FAMILIES[input.family];
  const ranked: Ranked[] = fam.hypotheses.map((h) => ({ ...h, probability: h.prior, failedFixes: 0, evidence: [] }));
  const lessonsUsed: Diagnosis["lessonsUsed"] = [];

  const t = (input.symptom ?? "").toLowerCase();
  for (const cue of SYMPTOM_CUES[input.family]) {
    if (cue.pattern.test(t)) {
      const h = ranked.find((x) => x.key === cue.hypothesis);
      if (h) h.probability *= cue.factor;
    }
  }

  if (input.memory) {
    for (const r of effectiveRecords(input.records)) {
      if (r.family !== input.family || !r.hypothesis || r.outcome === "pending") continue;
      const h = ranked.find((x) => x.key === r.hypothesis);
      if (!h) continue;
      const strength = weight(r.role, r.evidence);
      const factor = MULT[r.outcome][strength];
      h.probability *= factor;
      if (r.kind === "repair" && r.outcome === "returned") h.failedFixes++;
      h.evidence.push({
        recordId: r.outcomeRecordId ?? r.id,
        hypothesis: h.key,
        outcome: r.outcome,
        strength,
        factor,
        summary: `${r.action} → ${r.outcome.replace("_", " ")}${r.daysUntilReturn != null ? ` after ${r.daysUntilReturn} days` : ""} (${r.role}, ${r.evidence})`,
        blobId: r.outcomeRecordId ? r.outcomeBlobId : r.blobId,
      });
    }
    // Cross-device lessons: a gentle nudge, never stronger than this device's own history.
    // Poisoning resistance: one vote per wallet, the boost grows with the number of distinct
    // wallets that reported the same fix, and it is capped (×1.35) however many lessons exist.
    const voters = new Map<string, { authors: Set<string>; lessons: Lesson[] }>();
    for (const l of input.lessons ?? []) {
      if (l.family !== input.family || !ranked.some((x) => x.key === l.fixedBy)) continue;
      const v = voters.get(l.fixedBy) ?? { authors: new Set<string>(), lessons: [] };
      const voter = l.author ?? `passport:${l.passportId}`;
      if (!v.authors.has(voter)) { v.authors.add(voter); v.lessons.push(l); }
      voters.set(l.fixedBy, v);
    }
    for (const [key, v] of voters) {
      const boost = lessonBoost(v.authors.size);
      ranked.find((x) => x.key === key)!.probability *= boost;
      for (const l of v.lessons) lessonsUsed.push({ ...l, boost, independentReports: v.authors.size });
    }
  }

  const total = ranked.reduce((s, h) => s + h.probability, 0);
  for (const h of ranked) h.probability = h.probability / total;
  ranked.sort((a, b) => b.probability - a.probability);

  // Among causes close to the top, test the cheapest first.
  const top = ranked[0];
  const contenders = ranked.filter((h) => h.probability >= top.probability * 0.85);
  const pick = contenders.sort((a, b) => a.testCost - b.testCost || b.probability - a.probability)[0];
  const confirmedOnDevice = pick.evidence.some((e) => e.outcome === "confirmed" && e.strength === "strong");
  const recommendation = confirmedOnDevice
    ? { action: "fix" as const, hypothesis: pick, text: `${pick.fix} (cause confirmed by a tested technician check).` }
    : { action: "check" as const, hypothesis: pick, text: `Check first: ${pick.check}` };

  const avoid = ranked
    .filter((h) => h.failedFixes > 0)
    .map((h) => ({
      hypothesis: h,
      text: `${h.failedFixes} earlier ${h.failedFixes === 1 ? "attempt" : "attempts"} at "${h.fix.replace(/\.$/, "")}" did not hold on this device. Don't repeat it without new evidence.`,
    }));

  let headline: string;
  if (!input.memory) headline = `Generic advice for ${fam.label.toLowerCase()} faults: most likely "${top.label}".`;
  else if (avoid.length)
    headline = `This device has been here before. ${avoid
      .map((a) => `${a.hypothesis.failedFixes}× "${a.hypothesis.label}" fix failed`)
      .join("; ")}. Next: ${pick.label.toLowerCase()}.`;
  else if (!input.records.length && lessonsUsed.length) {
    const top = lessonsUsed[0];
    const n = top.independentReports;
    headline = `No history for this device yet, but ${n} other ${top.make} ${top.model} ${n === 1 ? "owner" : "owners"} fixed this fault with "${ranked.find((h) => h.key === top.fixedBy)?.label ?? top.fixedBy}". Next: ${pick.label.toLowerCase()}.`;
  } else if (input.records.length) headline = `Using ${input.records.length} recorded events for this device. Most likely: ${top.label}.`;
  else headline = `No history recorded for this device yet. Most likely: ${top.label}.`;

  return { family: input.family, memory: input.memory, ranked, recommendation, avoid, lessonsUsed, headline };
}

/** Cross-device boost for a fix reported by `wallets` distinct wallets: 1 → ×1.15, 2 → ×1.30, 3+ → ×1.35. */
export function lessonBoost(wallets: number): number {
  return wallets <= 0 ? 1 : Math.min(1.35, 1 + 0.15 * wallets);
}

export type TimelinePoint = { recordId: string; createdAt: string; label: string; probabilities: Record<string, number>; top: string };

/** How the diagnosis changed as each record was added: the "learning curve" of one device. */
export function learningTimeline(family: Family, records: RepairRecord[], symptom?: string): TimelinePoint[] {
  const ordered = [...records].filter((r) => r.family === family).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const point = (upTo: RepairRecord[], recordId: string, createdAt: string, label: string): TimelinePoint => {
    const d = diagnose({ family, records: upTo, memory: true, symptom });
    return { recordId, createdAt, label, top: d.ranked[0].key, probabilities: Object.fromEntries(d.ranked.map((h) => [h.key, Math.round(h.probability * 1000) / 1000])) };
  };
  const out = [point([], "start", ordered[0]?.createdAt ?? new Date(0).toISOString(), "Before any history")];
  ordered.forEach((r, i) => out.push(point(ordered.slice(0, i + 1), r.id, r.createdAt, r.action)));
  return out;
}

/** Very small keyword classifier for free-text symptoms. */
export function classifySymptom(text: string): Family {
  const t = text.toLowerCase();
  const score = (words: string[]) => words.reduce((s, w) => s + (t.includes(w) ? 1 : 0), 0);
  const s: Record<Family, number> = {
    charging: score(["charg", "battery", "power", "plug", "adapter", "won't turn on", "dies", "drain", "usb-c"]),
    thermal: score(["hot", "heat", "fan", "overheat", "shut", "thermal", "throttl", "loud"]),
    display: score(["screen", "display", "flicker", "lines", "black", "dim", "backlight", "monitor"]),
  };
  return (Object.entries(s).sort((a, b) => b[1] - a[1])[0][0] as Family) ?? "charging";
}
