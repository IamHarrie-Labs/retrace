import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { normalizeSuiAddress, isValidSuiAddress } from "@mysten/sui/utils";
import { config } from "./config";
import { ledger } from "./ledger";
import { suiClientIfConfigured } from "./sui-client";

const SESSION_COOKIE = "retrace_session";
const CHALLENGE_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 12 * 60 * 60_000;
function sign(payload: string) { return createHmac("sha256", config.sessionSecret()).update(payload).digest("base64url"); }
function safeEqual(a:string,b:string) { const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y); }
function messageFor(address:string,nonce:string,expiresAt:number,origin:string) {
  return ["Sign in to Retrace", "", "This signature proves you control this wallet. It costs nothing and moves no funds.", "", `Website: ${origin}`, `Address: ${address}`, `Nonce: ${nonce}`, `Expires: ${new Date(expiresAt).toISOString()}`].join("\n");
}
export function issueChallenge(rawAddress:string,origin:string) {
  if (!isValidSuiAddress(normalizeSuiAddress(rawAddress))) throw new Error("Invalid address");
  const address=normalizeSuiAddress(rawAddress),nonce=randomBytes(16).toString("hex"),expiresAt=Date.now()+CHALLENGE_TTL_MS;
  const message=messageFor(address,nonce,expiresAt,origin);
  return {address,nonce,expiresAt,origin,message,token:sign(message)};
}
export async function verifyChallenge(input:{address:string;nonce:string;expiresAt:number;origin:string;message:string;token:string;signature:string},expectedOrigin:string) {
  if (!isValidSuiAddress(input.address)||!/^[a-f0-9]{32}$/.test(input.nonce)||!Number.isSafeInteger(input.expiresAt)) throw new Error("Invalid challenge");
  if(input.origin!==expectedOrigin)throw new Error("Challenge belongs to a different website");
  if(Date.now()>input.expiresAt||input.expiresAt>Date.now()+CHALLENGE_TTL_MS+30_000)throw new Error("Challenge expired or invalid");
  const address=normalizeSuiAddress(input.address);
  const expected=messageFor(address,input.nonce,input.expiresAt,input.origin);
  if(input.message!==expected||!safeEqual(sign(expected),input.token))throw new Error("Message does not match the issued challenge");
  await verifyPersonalMessageSignature(new TextEncoder().encode(expected),input.signature,{address,client:suiClientIfConfigured()});
  if(!ledger().consumeChallenge(input.nonce,input.expiresAt))throw new Error("Challenge already used");
  return address;
}
export async function startSession(address:string) {
  const exp=Date.now()+SESSION_TTL_MS,payload=`${address}|${exp}`;
  (await cookies()).set(SESSION_COOKIE,`${payload}|${sign(payload)}`,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:SESSION_TTL_MS/1000});
}
export async function endSession() { (await cookies()).delete(SESSION_COOKIE); }
export async function sessionAddress():Promise<string|null> {
  const raw=(await cookies()).get(SESSION_COOKIE)?.value;if(!raw)return null;
  const parts=raw.split("|");if(parts.length!==3)return null;
  const [address,expiry,mac]=parts,exp=Number(expiry);
  if(!isValidSuiAddress(address)||!Number.isSafeInteger(exp)||exp<Date.now()||!safeEqual(sign(`${address}|${expiry}`),mac))return null;
  return normalizeSuiAddress(address);
}
