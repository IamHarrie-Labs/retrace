// Shared between server and client: no server-only imports here.
import { effectiveRecords, FAMILIES } from "./diagnose";
import type { RepairRecord } from "./records";

export const FOLLOWUP_AFTER_DAYS = 30;

export type FollowupDue = { recordId: string; action: string; family: string; repairedAt: string; dueAt: string; overdue: boolean };

/** Repairs whose outcome is still unknown: the follow-up is what the system learns from. */
export function followupsDue(records: RepairRecord[], now = Date.now()): FollowupDue[] {
  return effectiveRecords(records)
    .filter((r) => r.kind === "repair" && r.outcome === "pending")
    .map((r) => {
      const due = new Date(r.createdAt).getTime() + FOLLOWUP_AFTER_DAYS * 86_400_000;
      return { recordId: r.id, action: r.action, family: r.family, repairedAt: r.createdAt, dueAt: new Date(due).toISOString(), overdue: due <= now };
    });
}

export type PublicSummary = {
  owners: number;
  transfers: number;
  records: number;
  repairs: number;
  resolvedRepairs: number;
  failedRepairs: number;
  openFaults: number;
  attested: number;
  lastActivityAt: string | null;
  families: string[];
  status: "clean" | "resolved" | "open" | "no-history";
};

/**
 * What anyone may see before buying: counts and status only, never the
 * notes, shop names, costs or wallet history details.
 */
export function publicSummary(records: RepairRecord[], transfers: number, attestedIds: Set<string>): PublicSummary {
  const eff = effectiveRecords(records);
  const repairs = eff.filter((r) => r.kind === "repair");
  const resolved = repairs.filter((r) => r.outcome === "resolved").length;
  const failed = repairs.filter((r) => r.outcome === "returned").length;
  const families = [...new Set(records.map((r) => r.family))];
  const resolvedFamilies = new Set(repairs.filter((r) => r.outcome === "resolved").map((r) => r.family));
  const openFaults = families.filter((f) => !resolvedFamilies.has(f) && records.some((r) => r.family === f && r.kind !== "test")).length;
  const last = records.map((r) => r.createdAt).sort().at(-1) ?? null;
  return {
    owners: transfers + 1,
    transfers,
    records: records.length,
    repairs: repairs.length,
    resolvedRepairs: resolved,
    failedRepairs: failed,
    openFaults,
    attested: records.filter((r) => attestedIds.has(r.id)).length,
    lastActivityAt: last,
    families: families.map((f) => FAMILIES[f].label),
    status: !records.length ? "no-history" : openFaults ? "open" : resolved ? "resolved" : "clean",
  };
}
