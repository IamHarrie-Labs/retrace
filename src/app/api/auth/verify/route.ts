import { z } from "zod";
import { startSession,verifyChallenge } from "@/lib/auth";
import { errorResponse,readJson,requireSameOrigin,limitRequests,HttpError } from "@/lib/http";
const Input=z.object({address:z.string().max(66),nonce:z.string().length(32),expiresAt:z.number().int(),origin:z.string().url().max(250),message:z.string().max(1500),token:z.string().max(100),signature:z.string().max(5000)}).strict();
export async function POST(req:Request) {
  try {requireSameOrigin(req);limitRequests(req,"verify",20);const body=Input.parse(await readJson(req));let address:string;
    try{address=await verifyChallenge(body,process.env.APP_ORIGIN||new URL(req.url).origin);}catch{throw new HttpError(401,"The signature is invalid, expired or already used. Request a new sign-in message.");}
    await startSession(address);return Response.json({address},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
