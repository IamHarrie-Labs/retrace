import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { isValidSuiAddress,normalizeSuiAddress } from "@mysten/sui/utils";
import { errorResponse,HttpError,loadPassport } from "@/lib/access";
import { attestationMessage } from "@/lib/attest";
import { limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import { ledger } from "@/lib/ledger";
import { readRecords,writeAttestation } from "@/lib/memory";
import { readToken } from "@/lib/tokens";
import { suiClientIfConfigured } from "@/lib/sui-client";
import { z } from "zod";
type A={p:string;r:string};
async function open(token:string){
  const t=readToken<A>("attest",token);if(!t)throw new HttpError(410,"This verification link is invalid or has expired. Ask the device owner for a new one.");
  const passport=await loadPassport(t.p);const record=(await readRecords(passport.id)).find(r=>r.id===t.r);
  if(!record)throw new HttpError(404,"That record no longer exists.");
  return {passport,record};
}
/** The shop sees exactly one record (nothing else from the device history). */
export async function GET(req:Request){
  try{const {passport,record}=await open(new URL(req.url).searchParams.get("token")??"");
    const existing=ledger().attestations(passport.id).find(a=>a.recordId===record.id);
    const {author:_a,...shown}=record;
    return Response.json({device:`${passport.make} ${passport.model}`,passportId:passport.id,record:shown,attested:existing?{shop:existing.shop,signer:existing.signer,signedAt:existing.signedAt}:null},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
const Input=z.object({token:z.string().max(2048),shop:z.string().trim().min(2).max(80),address:z.string(),signature:z.string().max(4096).optional(),prepare:z.boolean().optional()}).strict();
/** Two steps: {prepare:true} returns the exact message to sign; then submit the signature. */
export async function POST(req:Request){
  try{requireSameOrigin(req);const body=Input.parse(await readJson(req));limitRequests(req,"attest",20);
    if(!isValidSuiAddress(normalizeSuiAddress(body.address)))throw new HttpError(400,"Invalid wallet address.");
    const signer=normalizeSuiAddress(body.address);const {passport,record}=await open(body.token);
    if(signer===passport.owner||signer===record.author)throw new HttpError(403,"An attestation must come from the shop, not the device owner.");
    const message=attestationMessage(`${passport.make} ${passport.model}`,passport.id,record,body.shop);
    if(body.prepare)return Response.json({message});
    if(!body.signature)throw new HttpError(400,"Signature required.");
    try{await verifyPersonalMessageSignature(new TextEncoder().encode(message),body.signature,{address:signer,client:suiClientIfConfigured()});}catch{throw new HttpError(401,"The signature does not match this wallet and record.");}
    const a={recordId:record.id,passportId:passport.id,signer,shop:body.shop,message,signature:body.signature,signedAt:new Date().toISOString()};
    if(!ledger().saveAttestation(a))throw new HttpError(409,"This record has already been attested.");
    const blobId=await writeAttestation(a,`${passport.make} ${passport.model}`);
    return Response.json({ok:true,blobId,shop:a.shop,signer},{status:201});
  }catch(e){return errorResponse(e);}
}
