import assert from "node:assert/strict";
import { mkdtempSync,readdirSync,unlinkSync,rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join,resolve,sep } from "node:path";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { RecordLedger,ledger } from "../src/lib/ledger";
import { issueChallenge,verifyChallenge } from "../src/lib/auth";
import { validateRecord } from "../src/lib/record-input";
import { diagnose,effectiveRecords } from "../src/lib/diagnose";
import { HttpError,readJson,requireSameOrigin } from "../src/lib/http";
import type { RepairRecord,Lesson } from "../src/lib/records";
import { signToken,readToken } from "../src/lib/tokens";
import { serialHash } from "../src/lib/serial";
import { canonicalModel } from "../src/lib/models";

const directory=mkdtempSync(join(tmpdir(),"retrace-core-"));
assert.ok(resolve(directory).startsWith(resolve(tmpdir())+sep));
process.env.RETRACE_DATA_DIR=directory;
process.env.SESSION_SECRET="retrace-isolated-test-secret-not-a-real-deployment-secret";
process.env.SERIAL_PEPPER="retrace-isolated-test-pepper";
const passportId="0x"+"1".repeat(64);
const base:RepairRecord={v:1,id:"repair-1",passportId,kind:"repair",family:"charging",hypothesis:"battery",action:"Battery replaced",outcome:"pending",author:"0x"+"a".repeat(64),role:"technician",evidence:"tested",createdAt:"2026-11-01T12:00:00.000Z"};
let checks=0;
function check(name:string,fn:()=>void){fn();checks++;console.log(`ok ${checks} - ${name}`);}
async function main(){
  const filename=join(directory,"records.sqlite");let store=new RecordLedger(filename);
  try{
    check("unconfirmed writes never enter the authoritative timeline",()=>{store.prepare(base,"request-1","fingerprint-1");assert.equal(store.records(passportId).length,0);store.setJob(base.id,"job-1");assert.equal(store.prepare({...base,id:"different-id"},"request-1","fingerprint-1").jobId,"job-1");});
    check("a retry reuses the same record and receipt",()=>{store.confirm(base,"test-blob-1");const retry=store.prepare({...base,id:"other-id"},"request-1","fingerprint-1");assert.equal(retry.record.id,base.id);assert.equal(retry.record.blobId,"test-blob-1");assert.equal(store.records(passportId).length,1);assert.throws(()=>store.prepare(base,"request-1","changed-content"),/IDEMPOTENCY_CONFLICT/);});
    check("complete timelines are not capped at 100 memories",()=>{for(let i=2;i<=135;i++){const record={...base,id:`record-${i}`,createdAt:new Date(Date.UTC(2026,10,1,12,0,i)).toISOString()};store.prepare(record,`request-${i}`,`fingerprint-${i}`);store.confirm(record,`test-blob-${i}`);}assert.equal(store.records(passportId).length,135);});
    check("records survive a database restart and stay isolated by passport",()=>{store.close();store=new RecordLedger(filename);assert.equal(store.records(passportId).length,135);assert.equal(store.records("another-passport").length,0);assert.equal(store.records(passportId)[0].id,base.id);});
    check("replay protection and request limits survive another database connection",()=>{assert.equal(store.consumeChallenge("nonce",Date.now()+60000),true);const second=new RecordLedger(filename);assert.equal(second.consumeChallenge("nonce",Date.now()+60000),false);assert.equal(second.allow("limit",2,60000).allowed,true);assert.equal(store.allow("limit",2,60000).allowed,true);assert.equal(second.allow("limit",2,60000).allowed,false);second.close();});
    const valid={kind:"repair",family:"charging",hypothesis:"battery",action:"Battery replaced",outcome:"returned",role:"owner",evidence:"reported"};
    check("invalid record/outcome combinations and unknown fields are rejected",()=>{assert.throws(()=>validateRecord({...valid,outcome:"confirmed"},[]));assert.throws(()=>validateRecord({...valid,author:"injected-wallet"},[]));assert.throws(()=>validateRecord({...valid,hypothesis:"fan"},[]));assert.throws(()=>validateRecord({...valid,action:"   "},[]));});
    check("follow-ups must refer to a repair on the same device and fault category",()=>{assert.throws(()=>validateRecord({...valid,kind:"followup",ref:"missing"},[base]));assert.throws(()=>validateRecord({...valid,kind:"followup",family:"thermal",ref:base.id},[base]));const followup=validateRecord({...valid,kind:"followup",ref:base.id,hypothesis:"forged"},[base]);assert.equal(followup.hypothesis,"battery");});
    check("irrelevant cost and return-day fields cannot silently alter a record",()=>{assert.throws(()=>validateRecord({...valid,outcome:"resolved",daysUntilReturn:3},[]));assert.throws(()=>validateRecord({...valid,kind:"test",outcome:"ruled_out",costUsd:20},[]));});
    const earlier:RepairRecord={...base,id:"earlier",kind:"followup",ref:base.id,outcome:"returned",daysUntilReturn:10,createdAt:"2026-11-03T12:00:00.000Z"};
    const latest:RepairRecord={...earlier,id:"latest",outcome:"resolved",role:"owner",evidence:"reported",blobId:"latest-receipt",createdAt:"2026-11-04T12:00:00.000Z"};
    check("the latest follow-up wins even when input order is shuffled",()=>{const effective=effectiveRecords([latest,base,earlier])[0];assert.equal(effective.outcome,"resolved");assert.equal(effective.evidence,"reported");assert.equal(effective.role,"owner");assert.equal(effective.daysUntilReturn,undefined);assert.equal(effective.outcomeBlobId,"latest-receipt");});
    check("diagnostic evidence points to the follow-up that changed the outcome",()=>{const result=diagnose({family:"charging",records:[latest,base,earlier],memory:true});const effect=result.ranked.find(r=>r.key==="battery")!.evidence[0];assert.equal(effect.recordId,"latest");assert.equal(effect.blobId,"latest-receipt");assert.equal(effect.strength,"weak");});
    check("repeated shared lessons cannot overwhelm this device's evidence",()=>{const lesson:Lesson={v:1,kind:"lesson",family:"charging",make:"Lenovo",model:"T480",symptom:"Charging",failed:[],fixedBy:"port",passportId:"other",createdAt:base.createdAt};const one=diagnose({family:"charging",records:[base],memory:true,lessons:[lesson]});const many=diagnose({family:"charging",records:[base],memory:true,lessons:Array(20).fill(lesson)});assert.deepEqual(one.ranked,many.ranked);assert.equal(many.lessonsUsed.length,1);});
    check("capability tokens are purpose-bound, tamper-evident and expire",()=>{const t=signToken("share",{p:"x",o:"y"},60_000);assert.equal(readToken<{p:string}>("share",t)?.p,"x");assert.equal(readToken("handover",t),null);assert.equal(readToken("share",t.slice(0,-2)+"AA"),null);assert.equal(readToken("share",signToken("share",{p:"x"},-1)),null);});
    check("handover links are claimed once, never by the seller",()=>{const seller="0x"+"5".repeat(64),buyer="0x"+"6".repeat(64),other="0x"+"7".repeat(64);store.createHandover("h1",passportId,seller,Date.now()+60_000);assert.equal(store.claimHandover("h1",seller)?.buyer,null);assert.equal(store.claimHandover("h1",buyer)?.buyer,buyer);assert.equal(store.claimHandover("h1",other)?.buyer,buyer);store.cancelHandovers(passportId,seller);assert.equal(store.latestHandover(passportId,seller),null);});
    check("serial hashes are keyed, normalized and 32 bytes",()=>{const a=serialHash("Lenovo","pf-1abc 23"),b=serialHash(" lenovo ","PF1ABC23");assert.equal(a.length,32);assert.deepEqual(a,b);assert.notDeepEqual(a,serialHash("Dell","PF1ABC23"));assert.throws(()=>serialHash("Lenovo","ab"));});
    check("model names match the catalogue regardless of spelling",()=>{assert.deepEqual(canonicalModel("lenovo","Thinkpad t-480"),{make:"Lenovo",model:"ThinkPad T480"});assert.equal(canonicalModel("Lenovo","T480"),null);});
    check("cross-site mutations are rejected",()=>{assert.throws(()=>requireSameOrigin(new Request("http://localhost:3000/api/test",{headers:{origin:"https://another-site.example"}})),HttpError);requireSameOrigin(new Request("http://localhost:3000/api/test",{headers:{origin:"http://localhost:3000"}}));});
    await assert.rejects(()=>readJson(new Request("http://localhost/api/test",{method:"POST",headers:{"content-type":"application/json"},body:"not-json"})),(e:unknown)=>e instanceof HttpError&&e.status===400);checks++;console.log(`ok ${checks} - malformed JSON receives a client error`);
    await assert.rejects(()=>readJson(new Request("http://localhost/api/test",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:"x".repeat(1000)})}),100),(e:unknown)=>e instanceof HttpError&&e.status===413);checks++;console.log(`ok ${checks} - oversized streamed bodies are rejected`);
    const keypair=new Ed25519Keypair(),origin="http://localhost:3000";
    const challenge=issueChallenge(keypair.toSuiAddress(),origin);
    const {signature}=await keypair.signPersonalMessage(new TextEncoder().encode(challenge.message));
    assert.equal(await verifyChallenge({...challenge,signature},origin),keypair.toSuiAddress());checks++;console.log(`ok ${checks} - a real Sui personal-message signature authenticates an isolated test wallet`);
    await assert.rejects(()=>verifyChallenge({...challenge,signature},origin),/already used/);checks++;console.log(`ok ${checks} - a used challenge cannot be replayed`);
    const changed=issueChallenge(keypair.toSuiAddress(),origin);
    const changedMessage=changed.message+"\nUnexpected extra terms";
    const changedSignature=await keypair.signPersonalMessage(new TextEncoder().encode(changedMessage));
    await assert.rejects(()=>verifyChallenge({...changed,message:changedMessage,signature:changedSignature.signature},origin),/does not match/);checks++;console.log(`ok ${checks} - even a signed message cannot alter the server-issued challenge`);
    await assert.rejects(()=>verifyChallenge({...changed,signature},"https://different.example"),/different website/);checks++;console.log(`ok ${checks} - sign-in signatures are website-bound`);
    const otherKey=new Ed25519Keypair();const wrong=await otherKey.signPersonalMessage(new TextEncoder().encode(changed.message));await assert.rejects(()=>verifyChallenge({...changed,signature:wrong.signature},origin));checks++;console.log(`ok ${checks} - a different wallet cannot claim another address`);
    console.log(`\n${checks} core checks passed. No network requests or Mainnet writes were made.`);
  }finally{store.close();ledger().close();for(const name of readdirSync(directory))unlinkSync(join(directory,name));rmdirSync(directory);}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
