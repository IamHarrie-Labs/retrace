import "server-only";
import { createHmac } from "node:crypto";
import { config } from "./config";

/** Same physical serial, same string: trims, upper-cases, drops spaces, dashes and dots. */
export function normalizeSerial(raw: string): string {
  return raw.normalize("NFKC").toUpperCase().replace(/[\s\-._/]/g, "");
}

export function normalizeMake(raw: string): string {
  return raw.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Keyed hash of make + serial. A plain SHA-256 of a short, structured serial
 * can be brute-forced to link a device to a wallet; an HMAC with a server-held
 * pepper cannot. 32 bytes, as the Move registry requires.
 */
export function serialHash(make: string, serial: string): Uint8Array {
  const s = normalizeSerial(serial);
  if (s.length < 4 || s.length > 64) throw new Error("Enter the serial number exactly as printed on the device.");
  return new Uint8Array(createHmac("sha256", config.serialPepper()).update(`retrace:v2:${normalizeMake(make)}:${s}`).digest());
}
