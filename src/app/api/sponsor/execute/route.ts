import { sessionAddress } from "@/lib/auth";
import { errorResponse,HttpError } from "@/lib/access";
import { limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import { enoki,sponsorshipEnabled } from "@/lib/sponsor";
import { z } from "zod";
export async function POST(req:Request){
  try{requireSameOrigin(req);if(!sponsorshipEnabled())throw new HttpError(404,"Gas sponsorship is not enabled.");
    const address=await sessionAddress();if(!address)throw new HttpError(401,"Sign in first.");limitRequests(req,"sponsor-exec",6,address);
    const {digest,signature}=z.object({digest:z.string().min(32).max(64),signature:z.string().min(32).max(8192)}).strict().parse(await readJson(req,16_384));
    const res=await enoki().executeSponsoredTransaction({digest,signature});
    return Response.json({digest:res.digest},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
