import { sessionAddress } from "@/lib/auth";
import { errorResponse,HttpError } from "@/lib/access";
import { limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import { enoki,sponsoredTargets,sponsorshipEnabled } from "@/lib/sponsor";
import { z } from "zod";
/** Sponsor a mint/transfer for the signed-in wallet. Returns bytes for the user to sign. */
export async function POST(req:Request){
  try{requireSameOrigin(req);if(!sponsorshipEnabled())throw new HttpError(404,"Gas sponsorship is not enabled.");
    const address=await sessionAddress();if(!address)throw new HttpError(401,"Sign in first.");limitRequests(req,"sponsor",6,address);
    const {transactionKindBytes}=z.object({transactionKindBytes:z.string().min(8).max(16_384)}).strict().parse(await readJson(req,32_768));
    const sponsored=await enoki().createSponsoredTransaction({network:"mainnet",transactionKindBytes,sender:address,allowedMoveCallTargets:sponsoredTargets(),allowedAddresses:[]});
    return Response.json({bytes:sponsored.bytes,digest:sponsored.digest},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
