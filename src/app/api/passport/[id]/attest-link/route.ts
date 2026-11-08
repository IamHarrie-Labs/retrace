import { authorize,errorResponse,HttpError } from "@/lib/access";
import { limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import { readRecords } from "@/lib/memory";
import { signToken } from "@/lib/tokens";
import { z } from "zod";
/** Owner asks the shop that did the work to co-sign one record. */
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
  try{requireSameOrigin(req);const {id}=await ctx.params;const {passport,address}=await authorize(id);limitRequests(req,"attest-link",20,address);
    const {recordId}=z.object({recordId:z.string().max(80)}).strict().parse(await readJson(req));
    const record=(await readRecords(passport.id)).find(r=>r.id===recordId);
    if(!record||record.kind==="symptom")throw new HttpError(400,"Choose a test, repair or follow-up on this device.");
    const token=signToken("attest",{p:passport.id,r:record.id},7*86_400_000);
    return Response.json({token,url:`/attest/${token}`},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
