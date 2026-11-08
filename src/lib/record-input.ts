import { z } from "zod";
import { FAMILIES } from "./diagnose";
import type { Kind, Outcome, RepairRecord } from "./records";

export const RecordInput = z.object({
  kind: z.enum(["symptom", "test", "repair", "followup"]),
  family: z.enum(["charging", "thermal", "display"]),
  hypothesis: z.string().max(40).optional(),
  action: z.string().trim().min(3).max(400),
  outcome: z.enum(["resolved", "returned", "ruled_out", "confirmed", "pending"]),
  ref: z.string().max(80).optional(),
  daysUntilReturn: z.number().int().min(0).max(3650).optional(),
  costUsd: z.number().finite().min(0).max(100000).optional(),
  role: z.enum(["owner", "technician"]),
  evidence: z.enum(["reported", "tested", "receipt"]),
  by: z.string().trim().max(80).optional(),
  shareLesson: z.boolean().default(false),
}).strict();

const outcomes: Record<Kind, Outcome[]> = { symptom:["pending"], test:["confirmed","ruled_out","pending"], repair:["resolved","returned","pending"], followup:["resolved","returned"] };

/** Relationships are checked against the exact event ledger, never vector search. */
export function validateRecord(input: unknown, records: RepairRecord[]) {
  const body = RecordInput.parse(input);
  if (!outcomes[body.kind].includes(body.outcome)) throw new Error("That outcome is not valid for this record type.");
  if (body.kind === "followup") {
    const repair = records.find(r => r.id === body.ref && r.kind === "repair");
    if (!repair) throw new Error("Select an existing repair on this device for the follow-up.");
    if (repair.family !== body.family) throw new Error("The follow-up must use the original repair’s fault category.");
    body.hypothesis = repair.hypothesis;
  } else if (body.ref) throw new Error("Only a follow-up can reference another repair.");
  if (body.kind === "symptom") body.hypothesis = undefined;
  if (body.kind === "test" || body.kind === "repair") {
    if (!FAMILIES[body.family].hypotheses.some(h => h.key === body.hypothesis)) throw new Error("Choose a valid cause for this fault category.");
  }
  if (body.daysUntilReturn !== undefined && body.outcome !== "returned") throw new Error("Days until return only applies when the fault returned.");
  if (body.costUsd !== undefined && body.kind !== "repair") throw new Error("A repair cost can only be attached to a repair.");
  return body;
}
