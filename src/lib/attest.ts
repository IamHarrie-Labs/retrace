import "server-only";
import { createHash } from "node:crypto";
import type { RepairRecord } from "./records";

/** Hash of the record as stored (blob receipt excluded), so a signature pins its exact content. */
export function recordHash(r: RepairRecord): string {
  const { blobId: _b, ...rest } = r;
  const canonical = JSON.stringify(Object.keys(rest).sort().reduce((o, k) => ({ ...o, [k]: (rest as Record<string, unknown>)[k] }), {}));
  return createHash("sha256").update(canonical).digest("hex");
}

export function attestationMessage(device: string, passportId: string, r: RepairRecord, shop: string): string {
  return [
    "Retrace shop attestation",
    "",
    "I confirm this repair record is accurate. Signing costs nothing and moves no funds.",
    "",
    `Device: ${device}`,
    `Passport: ${passportId}`,
    `Record: ${r.id}`,
    `Record hash: ${recordHash(r)}`,
    `Shop: ${shop}`,
  ].join("\n");
}
