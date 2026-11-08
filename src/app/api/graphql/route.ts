import { tatumFetch } from "@/lib/tatum";
import { z } from "zod";
import { errorResponse,HttpError,limitRequests,readJson,requireSameOrigin } from "@/lib/http";
const Query=z.object({query:z.string().min(1).max(100_000),variables:z.record(z.string(),z.unknown()).nullable().optional(),operationName:z.string().max(150).nullable().optional(),extensions:z.record(z.string(),z.unknown()).optional()}).strict();
export async function POST(req:Request){
  try{
    requireSameOrigin(req);limitRequests(req,"sui-client",120);const body=Query.parse(await readJson(req,512*1024));
    if(/\bsubscription\b/.test(body.query))throw new HttpError(400,"GraphQL subscriptions are not supported.");
    const response=await tatumFetch(JSON.stringify(body),30_000);
    if(!response.ok)throw new HttpError(502,"The Sui gateway is temporarily unavailable. Please retry.");
    return new Response(await response.text(),{status:200,headers:{"content-type":"application/json","Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
