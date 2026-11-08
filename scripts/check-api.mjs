import assert from "node:assert/strict";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const base=new URL(process.env.CHECK_BASE_URL||"http://localhost:3000");
if(!["localhost","127.0.0.1","[::1]"].includes(base.hostname))throw new Error("This smoke test only targets a local Retrace server.");
let count=0;
const pass=(name)=>console.log(`ok ${++count} - ${name}`);
async function call(path,init={}){return fetch(new URL(path,base),{...init,headers:{origin:base.origin,...init.headers},signal:AbortSignal.timeout(45_000)});}
const json=(body,headers={})=>({method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify(body)});
const keypair=new Ed25519Keypair();
let response=await call("/api/auth/session");assert.equal(response.status,200);assert.equal((await response.json()).address,null);pass("anonymous sessions stay anonymous");
response=await call("/api/auth/challenge",{method:"POST",headers:{"content-type":"application/json"},body:"{"});assert.equal(response.status,400);pass("malformed requests are handled by the live server");
response=await call("/api/auth/challenge",json({address:keypair.toSuiAddress()},{origin:"https://another-site.example"}));assert.equal(response.status,403);pass("cross-site sign-in requests are rejected");
response=await call("/api/passport/0x1/records",json({}));assert.equal(response.status,401);pass("anonymous users cannot write repair memories");
response=await call("/api/passport/not-an-object");assert.equal(response.status,400);pass("invalid object identifiers fail before a chain request");
response=await call("/api/auth/challenge",json({address:keypair.toSuiAddress()}));assert.equal(response.status,200);const challenge=await response.json();
const {signature}=await keypair.signPersonalMessage(new TextEncoder().encode(challenge.message));
response=await call("/api/auth/verify",json({...challenge,message:challenge.message+"\nchanged",signature}));assert.equal(response.status,401);pass("an altered sign-in message cannot create a session");
response=await call("/api/auth/verify",json({...challenge,signature}));assert.equal(response.status,200);const cookie=response.headers.getSetCookie().find(value=>value.startsWith("retrace_session="))?.split(";")[0];assert.ok(cookie,"A signed session cookie should be issued");pass("an isolated test wallet can sign in through the real API");
response=await call("/api/auth/verify",json({...challenge,signature}));assert.equal(response.status,401);pass("the live server rejects replayed signatures");
response=await call("/api/auth/session",{headers:{cookie}});assert.equal((await response.json()).address,keypair.toSuiAddress());pass("authenticated sessions return the proven address");
response=await call("/api/passports",{headers:{cookie}});assert.equal(response.status,200);assert.ok(Array.isArray((await response.json()).passports));pass("the signed-in device inventory reads successfully through Tatum");
response=await call("/api/auth/session",{method:"DELETE",headers:{cookie}});assert.equal(response.status,200);assert.ok(response.headers.getSetCookie().some(value=>value.startsWith("retrace_session=")));pass("sign-out clears the browser session cookie");
console.log(`\n${count} local API checks passed. No funds, Mainnet writes or passport transfers were performed.`);
