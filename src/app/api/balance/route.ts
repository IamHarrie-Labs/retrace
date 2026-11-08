import { sessionAddress } from "@/lib/auth";
import { errorResponse,HttpError } from "@/lib/access";
import { getSuiBalance } from "@/lib/tatum";
import { sponsorshipEnabled } from "@/lib/sponsor";
/** Gas readiness before a mint or transfer, read via Tatum. */
export async function GET(){
  try{const address=await sessionAddress();if(!address)throw new HttpError(401,"Sign in first.");
    const mist=await getSuiBalance(address);
    return Response.json({address,mist:mist.toString(),sui:Number(mist)/1e9,enough:mist>=BigInt(10_000_000),sponsored:sponsorshipEnabled()},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
