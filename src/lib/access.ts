import "server-only";
import { isValidSuiObjectId, normalizeSuiObjectId } from "@mysten/sui/utils";
import { sessionAddress } from "./auth";
import { getPassport, type Passport } from "./tatum";
import { HttpError } from "./http";
import { readToken } from "./tokens";
export { HttpError, errorResponse } from "./http";

/**
 * The app's access rule: you may read or write a device's memory only while
 * Tatum reports your signed-in wallet as the passport's current owner.
 * Transfer the passport and access moves with it.
 */
export async function authorize(rawId: string): Promise<{ passport: Passport; address: string }> {
  const address = await sessionAddress();
  if (!address) throw new HttpError(401, "Sign in with your wallet first.");
  const passport = await loadPassport(rawId);
  if (passport.ownerKind !== "address" || passport.owner !== address) {
    throw new HttpError(403, "Only the passport's current owner can open this device's repair memory.");
  }
  return { passport, address };
}

export async function loadPassport(rawId: string): Promise<Passport> {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(rawId) || !isValidSuiObjectId(normalizeSuiObjectId(rawId))) throw new HttpError(400, "Invalid passport ID.");
  const passport = await getPassport(normalizeSuiObjectId(rawId), { fresh: true });
  if (!passport) throw new HttpError(404, "No Retrace passport with that ID on Sui Mainnet.");
  return passport;
}


export type ShareToken = { p: string; o: string };

/** A read-only share link is valid only while the wallet that created it still owns the passport. */
export function validShare(token: string | null | undefined, passport: Passport): boolean {
  if (!token) return false;
  const t = readToken<ShareToken>("share", token);
  return !!t && t.p === passport.id && passport.ownerKind === "address" && t.o === passport.owner;
}

/** Read access: the current owner, or anyone holding a live share link from that owner. */
export async function authorizeRead(rawId: string, shareToken?: string | null): Promise<{ passport: Passport; address: string | null; via: "owner" | "share" }> {
  const address = await sessionAddress();
  const passport = await loadPassport(rawId);
  if (address && passport.ownerKind === "address" && passport.owner === address) return { passport, address, via: "owner" };
  if (validShare(shareToken, passport)) return { passport, address, via: "share" };
  if (!address && !shareToken) throw new HttpError(401, "Sign in with your wallet first.");
  throw new HttpError(403, shareToken ? "This share link has expired or the device has changed hands." : "Only the passport's current owner can open this device's repair memory.");
}
