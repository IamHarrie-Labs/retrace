// Shared between server and client: no server-only imports here.

export type Family = "charging" | "thermal" | "display";
export type Kind = "symptom" | "test" | "repair" | "followup";
export type Outcome = "resolved" | "returned" | "ruled_out" | "confirmed" | "pending";
export type Role = "owner" | "technician";
/** How the claim is supported. "reported" = someone says so; "tested" = measured / observed by a technician; "receipt" = paid work with a receipt (proves work was done, not that it worked). */
export type Evidence = "reported" | "tested" | "receipt";

export type RepairRecord = {
  v: 1;
  id: string;
  passportId: string;
  kind: Kind;
  family: Family;
  /** Hypothesis this record is about (see diagnose.ts). */
  hypothesis?: string;
  /** What was done or observed, in plain words. */
  action: string;
  outcome: Outcome;
  /** For followups: the repair record this updates. */
  ref?: string;
  /** Days until the fault came back, if it did. */
  daysUntilReturn?: number;
  costUsd?: number;
  author: string;
  role: Role;
  evidence: Evidence;
  /** Name of the shop/technician as entered (no personal data of owners). */
  by?: string;
  createdAt: string;
  /** Present when read back from Walrus. */
  blobId?: string;
};

export type Lesson = {
  v: 1;
  kind: "lesson";
  family: Family;
  make: string;
  model: string;
  symptom: string;
  failed: string[];
  fixedBy: string;
  passportId: string;
  /** Wallet that shared the lesson (one vote per wallet when lessons are weighed). */
  author?: string;
  /** True when the fix it is based on carries a shop attestation. */
  attested?: boolean;
  createdAt: string;
  blobId?: string;
};

const TAG = "[[retrace]]";

export function sentenceFor(r: RepairRecord, deviceLabel: string): string {
  const who = `${r.role === "technician" ? "Technician" : "Owner"}${r.by ? ` (${r.by})` : ""}`;
  const ev = r.evidence === "tested" ? "tested" : r.evidence === "receipt" ? "with receipt" : "reported";
  const out: Record<Outcome, string> = {
    resolved: "The fault was resolved.",
    returned: `The fault came back${r.daysUntilReturn != null ? ` after ${r.daysUntilReturn} days` : ""}.`,
    ruled_out: "This cause was ruled out.",
    confirmed: "This cause was confirmed.",
    pending: "Outcome not known yet.",
  };
  const kind = { symptom: "Symptom", test: "Diagnostic test", repair: "Repair", followup: "Follow-up" }[r.kind];
  return `${kind} on ${deviceLabel} [${r.family}]: ${r.action}. ${out[r.outcome]} ${who}, ${ev}.`;
}

export function encodeRecord(r: RepairRecord, deviceLabel: string): string {
  return `${sentenceFor(r, deviceLabel)}\n${TAG}${JSON.stringify(r)}`;
}

export function encodeLesson(l: Lesson): string {
  const s = `Lesson for ${l.make} ${l.model} [${l.family}], symptom "${l.symptom}": ${
    l.failed.length ? `tried without lasting success: ${l.failed.join(", ")}; ` : ""
  }fixed by ${l.fixedBy}.`;
  return `${s}\n${TAG}${JSON.stringify(l)}`;
}

export function decode<T>(text: string): T | null {
  const i = text.indexOf(TAG);
  if (i < 0) return null;
  try {
    return JSON.parse(text.slice(i + TAG.length)) as T;
  } catch {
    return null;
  }
}
