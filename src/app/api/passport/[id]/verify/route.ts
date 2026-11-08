import { authorizeRead,errorResponse } from "@/lib/access";
import { limitRequests } from "@/lib/http";
import { verifyAgainstWalrus } from "@/lib/memory";
/** Cross-check: every record in the index must exist in this device's Walrus Memory namespace. */
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){
  try{const {id}=await ctx.params;const {passport,address}=await authorizeRead(id,new URL(req.url).searchParams.get("share"));
    limitRequests(req,"verify",20,address??undefined);
    return Response.json(await verifyAgainstWalrus(passport.id),{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
