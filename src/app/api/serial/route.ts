import { sessionAddress } from "@/lib/auth";
import { errorResponse,HttpError } from "@/lib/access";
import { limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import { serialHash } from "@/lib/serial";
import { getRegisteredPassport } from "@/lib/tatum";
import { z } from "zod";
/**
 * Keyed serial hash for minting, plus a pre-check against the onchain Registry
 * (via Tatum) so a duplicate is caught before the wallet is asked to sign.
 * The raw serial is used in memory only and never stored or logged.
 */
export async function POST(req:Request){
  try{requireSameOrigin(req);const address=await sessionAddress();if(!address)throw new HttpError(401,"Sign in first.");
    limitRequests(req,"serial",20,address);
    const {make,serial}=z.object({make:z.string().trim().min(1).max(80),serial:z.string().trim().min(1).max(120)}).strict().parse(await readJson(req));
    let hash:Uint8Array;try{hash=serialHash(make,serial);}catch(e){throw new HttpError(400,e instanceof Error?e.message:"Invalid serial.");}
    const existing=await getRegisteredPassport(hash);
    return Response.json({hash:Buffer.from(hash).toString("hex"),registered:existing},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
