import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";

/**
 * Signed, expiring capability links (share, handover, shop attestation).
 * Format: base64url(json).base64url(hmac). Purpose is part of the MAC input,
 * so a token minted for one purpose can never be replayed as another.
 */
type Purpose = "share" | "handover" | "attest";

function mac(purpose: Purpose, body: string) {
  return createHmac("sha256", config.sessionSecret()).update(`retrace-token:${purpose}:${body}`).digest("base64url");
}

export function signToken<T extends object>(purpose: Purpose, payload: T, ttlMs: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  return `${body}.${mac(purpose, body)}`;
}

export function readToken<T extends object>(purpose: Purpose, token: string): (T & { exp: number }) | null {
  if (typeof token !== "string" || token.length > 2048) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(purpose, body)), got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!Number.isSafeInteger(payload.exp) || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Stable short id for a token (to store state without storing the token). */
export const tokenId = (token: string) => createHash("sha256").update(token).digest("hex").slice(0, 32);
