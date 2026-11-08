import { sessionAddress } from "@/lib/auth";
import { errorResponse,HttpError,loadPassport } from "@/lib/access";
import { limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import { ledger } from "@/lib/ledger";
import { readToken,tokenId } from "@/lib/tokens";
import { readRecords } from "@/lib/memory";
import { publicSummary } from "@/lib/summary";
import { getPassportEvents } from "@/lib/tatum";
import { z } from "zod";
type H={p:string;s:string;n:string};
async function open(token:string){
  const t=readToken<H>("handover",token);if(!t)throw new HttpError(410,"This handover link is invalid or has expired. Ask the seller for a new one.");
  const h=ledger().handover(tokenId(token));if(!h||h.expiresAt<Date.now())throw new HttpError(410,"This handover link was cancelled or replaced.");
  const passport=await loadPassport(t.p);
  if(passport.owner!==t.s)throw new HttpError(410,"This device has already changed hands.");
  return {t,h,passport};
}
/** Buyer previews what they are about to receive (public summary only). */
export async function GET(req:Request){
  try{const token=new URL(req.url).searchParams.get("token")??"";const {h,passport}=await open(token);
    const events=await getPassportEvents(passport.id);const records=await readRecords(passport.id);
    return Response.json({passport:{id:passport.id,make:passport.make,model:passport.model,owner:passport.owner},
      summary:publicSummary(records,events.filter(e=>e.kind==="transferred").length,new Set(ledger().attestations(passport.id).map(a=>a.recordId))),
      claimedBy:h.buyer,viewer:await sessionAddress()},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
/** Buyer claims: records their signed-in address so the seller can transfer with one click. */
export async function POST(req:Request){
  try{requireSameOrigin(req);const address=await sessionAddress();if(!address)throw new HttpError(401,"Sign in to claim this device.");
    limitRequests(req,"claim",20,address);const {token}=z.object({token:z.string().max(2048)}).strict().parse(await readJson(req));
    const {h,passport}=await open(token);
    if(address===passport.owner)throw new HttpError(400,"You already hold this passport. Send the link to the buyer.");
    const claimed=ledger().claimHandover(h.id,address);
    if(!claimed||claimed.buyer!==address)throw new HttpError(409,"Another wallet has already claimed this handover link.");
    return Response.json({ok:true,buyer:address,passportId:passport.id});
  }catch(e){return errorResponse(e);}
}
