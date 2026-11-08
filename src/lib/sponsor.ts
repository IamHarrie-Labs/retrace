import "server-only";
import { EnokiClient } from "@mysten/enoki";
import { config } from "./config";

/** Gas sponsorship through Enoki: users mint and transfer passports without holding SUI. */
export const sponsorshipEnabled = () => !!process.env.ENOKI_PRIVATE_KEY;

let client: EnokiClient | null = null;
export function enoki() {
  if (!process.env.ENOKI_PRIVATE_KEY) throw new Error("Sponsorship is not configured");
  return (client ??= new EnokiClient({ apiKey: process.env.ENOKI_PRIVATE_KEY }));
}

/** Only Retrace's own entry functions can be sponsored, so the gas budget can't be drained by arbitrary calls. */
export const sponsoredTargets = () => [`${config.packageId()}::passport::mint`, `${config.packageId()}::passport::transfer_passport`];
