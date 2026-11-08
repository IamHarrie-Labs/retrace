import { authorize,errorResponse } from "@/lib/access";
import { readRecords } from "@/lib/memory";
import { getPassport } from "@/lib/tatum";
import { HttpError } from "@/lib/http";
export async function GET(_req:Request,ctx:{params:Promise<{id:string}>}){
  try{
    const {id}=await ctx.params;const {passport,address}=await authorize(id);const records=await readRecords(passport.id);
    if((await getPassport(passport.id,{fresh:true}))?.owner!==address)throw new HttpError(403,"This passport changed hands. Your access has ended.");
    return new Response(JSON.stringify({format:"retrace-service-book",version:1,exportedAt:new Date().toISOString(),passport,records},null,2),{headers:{"content-type":"application/json","content-disposition":`attachment; filename="retrace-${passport.id.slice(2,14)}.json"`,"Cache-Control":"private, no-store"}});
  }catch(e){return errorResponse(e);}
}
