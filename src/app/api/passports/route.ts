import { sessionAddress } from "@/lib/auth";
import { errorResponse } from "@/lib/access";
import { readRecords } from "@/lib/memory";
import { followupsDue } from "@/lib/summary";
import { getOwnedPassports } from "@/lib/tatum";

/** Passports held by the signed-in wallet (read from Sui via Tatum), with follow-ups that are due. */
export async function GET() {
  try {
    const address = await sessionAddress();
    if (!address) return Response.json({ error: "Sign in first." }, { status: 401 });
    const passports = await getOwnedPassports(address);
    const withDue = await Promise.all(passports.map(async (p) => {
      try {
        const records = await readRecords(p.id);
        return { ...p, records: records.length, followupsDue: followupsDue(records) };
      } catch {
        return { ...p, records: null, followupsDue: [] };
      }
    }));
    return Response.json({ address, passports: withDue });
  } catch (e) {
    return errorResponse(e);
  }
}
