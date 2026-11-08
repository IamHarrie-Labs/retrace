import { z } from "zod";
import { issueChallenge } from "@/lib/auth";
import { errorResponse, readJson, requireSameOrigin, limitRequests, HttpError } from "@/lib/http";
const Input=z.object({address:z.string().min(3).max(66)}).strict();
export async function POST(req:Request) {
  try {requireSameOrigin(req);limitRequests(req,"challenge",15);const input=Input.parse(await readJson(req));
    try{return Response.json(issueChallenge(input.address,process.env.APP_ORIGIN||new URL(req.url).origin),{headers:{"Cache-Control":"no-store"}});}
    catch{throw new HttpError(400,"Enter a valid Sui wallet address.");}
  }catch(e){return errorResponse(e);}
}
