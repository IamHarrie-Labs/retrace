import "server-only";
import { createHash } from "node:crypto";
import { MemWal, MemWalRememberJobFailedError } from "@mysten-incubation/memwal";
import { config } from "./config";
import { decode,encodeLesson,encodeRecord,type Family,type Lesson,type RepairRecord } from "./records";
import { ledger,type Attestation } from "./ledger";
import { modelKey } from "./models";
import { HttpError } from "./http";
import { getPassport } from "./tatum";

let client:MemWal|null=null;
function memwal(){return client??=MemWal.create({key:config.memwalKey(),accountId:config.memwalAccountId(),serverUrl:config.memwalServerUrl,requestTimeoutMs:30_000,preflightTimeoutMs:8_000});}
export const deviceNamespace=(id:string)=>`retrace-device-${id.toLowerCase()}`;
export const lessonsNamespace=(family:Family)=>`retrace-lessons-${family}`;

/** Persist the accepted job before polling; retries resume that same upload. */
export async function writeRecord(record:RepairRecord,label:string,jobId?:string|null,attempt=0){
  const ns=deviceNamespace(record.passportId);
  if(!jobId){const accepted=await memwal().rememberAsync(encodeRecord(record,label),ns,{idempotencyKey:`${record.id}:${attempt}`});jobId=accepted.job_id;ledger().setJob(record.id,jobId);}
  let receipt;
  try { receipt=await memwal().waitForRememberJob(jobId,{timeoutMs:90_000}); }
  catch(error) {
    if(error instanceof MemWalRememberJobFailedError) { ledger().retryFailed(record.id); throw new HttpError(503,"The storage job failed. Retry the same save to start a new attempt."); }
    throw error;
  }
  if(!receipt.blob_id||receipt.namespace!==ns)throw new HttpError(503,"The memory service returned an invalid storage receipt.");
  return ledger().confirm(record,receipt.blob_id);
}

const initializing=new Map<string,Promise<void>>();
async function importLegacyRecords(passportId:string){
  const db=ledger();if(db.initialized(passportId))return;
  const ns=deviceNamespace(passportId),expected=new Set<string>();
  let cursor:string|undefined;
  for(let pageNumber=0;;pageNumber++){
    if(pageNumber>=1000)throw new HttpError(503,"Memory inventory could not be completely inspected.");
    const page=await memwal().listMemories({namespace:ns,cursor,limit:500});
    if(page.must_resync)throw new HttpError(503,"The memory inventory changed. Please retry.");
    for(const item of page.memories)expected.add(item.blob_id);
    if(!page.has_more)break;
    if(!page.next_cursor||page.next_cursor===cursor)throw new HttpError(503,"Memory inventory pagination did not advance.");
    cursor=page.next_cursor;
  }
  if(expected.size>100)throw new HttpError(503,"This legacy history exceeds the recovery limit. Restore the persistent Retrace ledger backup before continuing.");
  if(expected.size){
    const recalled=await memwal().recall({query:"repair history: symptoms tests repairs follow-ups outcomes",namespace:ns,limit:100});
    const byBlob=new Map(recalled.results.map(hit=>[hit.blob_id,hit]));
    if(recalled.dropped_count||[...expected].some(id=>!byBlob.has(id)))throw new HttpError(503,"Some stored history could not be recovered. No incomplete history will be used for advice.");
    for(const blobId of expected){
      const record=decode<RepairRecord>(byBlob.get(blobId)!.text);
      if(!record||record.v!==1||record.passportId!==passportId||!record.id||!record.createdAt)throw new HttpError(503,"A legacy record needs repair before this history can be loaded.");
      const fingerprint=createHash("sha256").update(JSON.stringify(record)).digest("hex");
      db.prepare(record,`legacy:${record.id}`,fingerprint);db.confirm(record,blobId);
    }
  }
  db.initialize(passportId);
}

/** Exact indexed events, ordered deterministically and unlimited by semantic top-K. */
export async function readRecords(passportId:string,_fresh=false):Promise<RepairRecord[]>{
  if(!ledger().initialized(passportId)){
    let init=initializing.get(passportId);
    if(!init){init=importLegacyRecords(passportId);initializing.set(passportId,init);}
    try{await init;}finally{initializing.delete(passportId);}
  }
  return ledger().records(passportId);
}
export async function writeLesson(lesson:Lesson,key:string){
  const receipt=await memwal().rememberAndWait(encodeLesson(lesson),lessonsNamespace(lesson.family),{idempotencyKey:key});
  return {...lesson,blobId:receipt.blob_id};
}
export async function recallLessons(family:Family,make:string,model:string,symptom:string):Promise<Lesson[]>{
  const recalled=await memwal().recall({query:`${make} ${model}: ${symptom}`,namespace:lessonsNamespace(family),limit:8,maxDistance:.6});
  return recalled.results.map(hit=>{const lesson=decode<Lesson>(hit.text);return lesson?{...lesson,blobId:hit.blob_id}:null;})
    .filter((lesson):lesson is Lesson&{blobId:string}=>!!lesson&&lesson.family===family&&modelKey(lesson.make,lesson.model)===modelKey(make,model));
}
export const attestationsNamespace=(id:string)=>`retrace-attest-${id.toLowerCase()}`;

/** Shop attestations live in their own namespace so device history stays a pure record stream. */
export async function writeAttestation(a:Attestation,deviceLabel:string){
  const text=`Shop attestation on ${deviceLabel}: ${a.shop} (${a.signer}) signed record ${a.recordId} on ${a.signedAt}.
[[retrace]]${JSON.stringify({v:1,kind:"attestation",...a})}`;
  const receipt=await memwal().rememberAndWait(text,attestationsNamespace(a.passportId),{idempotencyKey:`attest:${a.recordId}`});
  ledger().setAttestationBlob(a.recordId,receipt.blob_id);
  return receipt.blob_id;
}

/** Cross-check the exact ledger against what Walrus Memory actually holds for this device. */
export async function verifyAgainstWalrus(passportId:string){
  const ns=deviceNamespace(passportId),onWalrus=new Set<string>();let cursor:string|undefined;
  for(let pageNumber=0;;pageNumber++){
    if(pageNumber>=1000)throw new HttpError(503,"Memory inventory could not be completely inspected.");
    const page=await memwal().listMemories({namespace:ns,cursor,limit:500});
    for(const item of page.memories)onWalrus.add(item.blob_id);
    if(!page.has_more)break;
    if(!page.next_cursor||page.next_cursor===cursor)throw new HttpError(503,"Memory inventory pagination did not advance.");
    cursor=page.next_cursor;
  }
  const records=ledger().records(passportId);
  const missing=records.filter(r=>!r.blobId||!onWalrus.has(r.blobId)).map(r=>r.id);
  const known=new Set(records.map(r=>r.blobId));
  return {namespace:ns,checkedAt:new Date().toISOString(),ledgerRecords:records.length,walrusMemories:onWalrus.size,matched:records.length-missing.length,missing,extraOnWalrus:[...onWalrus].filter(b=>!known.has(b)).length};
}

export async function memoryStats(){
  const m=memwal(),namespaces:{name:string;memory_count:number}[]=[];let cursor:string|undefined;
  for(let pageNumber=0;;pageNumber++){
    if(pageNumber>=1000)throw new HttpError(503,"Memory inventory is too large to inspect in one request.");
    const page=await m.listNamespaces({cursor});namespaces.push(...page.namespaces.filter(n=>n.name.startsWith("retrace-")));
    if(!page.has_more)break;if(!page.next_cursor||page.next_cursor===cursor)throw new HttpError(503,"Memory inventory pagination did not advance.");cursor=page.next_cursor;
  }
  const health=await m.health();
  // Device spaces whose passport isn't on the current contract (the first test deployment) stay listed but don't count as laptops.
  const devicePrefix="retrace-device-",idOf=(name:string)=>name.replace(/^retrace-(device|attest)-/,"");
  const deviceIds=namespaces.filter(ns=>ns.name.startsWith(devicePrefix)).map(ns=>idOf(ns.name));
  const current=new Map(await Promise.all(deviceIds.map(async id=>[id,await getPassport(id).then(p=>!!p,()=>true)] as const)));
  const listed=namespaces.map(ns=>({...ns,retired:/^retrace-(device|attest)-/.test(ns.name)&&current.get(idOf(ns.name))===false}));
  return {accountId:config.memwalAccountId(),relayer:config.memwalServerUrl,relayerStatus:health.status,total:listed.reduce((sum,ns)=>sum+ns.memory_count,0),
    devices:deviceIds.filter(id=>current.get(id)).length,retiredDevices:deviceIds.filter(id=>!current.get(id)).length,namespaces:listed};
}

const attestChecked=new Set<string>();
/**
 * Attestations for a passport. If the local index has none (a fresh server, a lost volume),
 * rebuild them once from the device's attestation namespace on Walrus. Each one is re-checked
 * before it counts: the message must match the record as stored now, the signer must not be
 * the record's author, and the wallet signature must verify.
 */
export async function readAttestations(passport:{id:string;make:string;model:string},records:RepairRecord[]):Promise<Attestation[]>{
  const db=ledger();const indexed=db.attestations(passport.id);
  if(indexed.length||attestChecked.has(passport.id))return indexed;
  try{
    const ns=attestationsNamespace(passport.id);
    const page=await memwal().listMemories({namespace:ns,limit:100});
    if(page.memories.length){
      const recalled=await memwal().recall({query:"shop attestation signed record",namespace:ns,limit:100});
      const { verifyPersonalMessageSignature }=await import("@mysten/sui/verify");
      const { suiClientIfConfigured }=await import("./sui-client");
      const { attestationMessage }=await import("./attest");
      const byId=new Map(records.map(r=>[r.id,r]));
      for(const hit of recalled.results){
        const a=decode<Attestation&{v:number;kind:string}>(hit.text);
        if(!a||a.kind!=="attestation"||a.passportId!==passport.id)continue;
        const record=byId.get(a.recordId);
        if(!record||a.signer===record.author)continue;
        if(a.message!==attestationMessage(`${passport.make} ${passport.model}`,passport.id,record,a.shop))continue;
        try{await verifyPersonalMessageSignature(new TextEncoder().encode(a.message),a.signature,{address:a.signer,client:suiClientIfConfigured()});}catch{continue;}
        db.saveAttestation({recordId:a.recordId,passportId:a.passportId,signer:a.signer,shop:a.shop,message:a.message,signature:a.signature,signedAt:a.signedAt,blobId:hit.blob_id});
      }
    }
    attestChecked.add(passport.id);
  }catch{ /* Walrus unreachable: show what the index has and try again on the next request. */ }
  return db.attestations(passport.id);
}
