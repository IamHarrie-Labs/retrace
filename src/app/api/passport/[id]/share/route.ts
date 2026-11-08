import { authorize,errorResponse } from "@/lib/access";
import { limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import { signToken } from "@/lib/tokens";
import { z } from "zod";
const Input=z.object({days:z.number().int().min(1).max(30).default(7)}).strict();
/** Owner creates a read-only link for a prospective buyer (due diligence before purchase). */
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
  try{
    requireSameOrigin(req);const {id}=await ctx.params;const {passport,address}=await authorize(id);limitRequests(req,"share",20,address);
    const {days}=Input.parse(await readJson(req));const ttl=days*86_400_000;
    const token=signToken("share",{p:passport.id,o:address},ttl);
    return Response.json({token,url:`/passport/${passport.id}?share=${token}`,expiresAt:new Date(Date.now()+ttl).toISOString()},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
