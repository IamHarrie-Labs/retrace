import { authorize,errorResponse } from "@/lib/access";
import { limitRequests,requireSameOrigin } from "@/lib/http";
import { ledger } from "@/lib/ledger";
import { signToken,tokenId } from "@/lib/tokens";
const TTL=3*86_400_000;
/** Seller's view of the current handover: has a buyer opened the claim link yet? */
export async function GET(_req:Request,ctx:{params:Promise<{id:string}>}){
  try{const {id}=await ctx.params;const {passport,address}=await authorize(id);
    const h=ledger().latestHandover(passport.id,address);
    return Response.json({handover:h&&{buyer:h.buyer,claimedAt:h.claimedAt,expiresAt:h.expiresAt}},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
/** Seller creates a claim link. The buyer opens it and signs in; no address copy-paste. */
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
  try{requireSameOrigin(req);const {id}=await ctx.params;const {passport,address}=await authorize(id);limitRequests(req,"handover",10,address);
    ledger().cancelHandovers(passport.id,address);
    const token=signToken("handover",{p:passport.id,s:address,n:crypto.randomUUID()},TTL);
    ledger().createHandover(tokenId(token),passport.id,address,Date.now()+TTL);
    return Response.json({token,url:`/claim/${token}`,expiresAt:new Date(Date.now()+TTL).toISOString()},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
/** Seller cancels any open claim link. */
export async function DELETE(req:Request,ctx:{params:Promise<{id:string}>}){
  try{requireSameOrigin(req);const {id}=await ctx.params;const {passport,address}=await authorize(id);ledger().cancelHandovers(passport.id,address);return Response.json({ok:true});}
  catch(e){return errorResponse(e);}
}
