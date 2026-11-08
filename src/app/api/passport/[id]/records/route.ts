import { createHash,randomUUID } from "node:crypto";
import { authorize,errorResponse } from "@/lib/access";
import { readRecords,writeLesson,writeRecord } from "@/lib/memory";
import { effectiveRecords,FAMILIES } from "@/lib/diagnose";
import { validateRecord } from "@/lib/record-input";
import { ledger } from "@/lib/ledger";
import { canonicalModel } from "@/lib/models";
import { HttpError,limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import type { RepairRecord } from "@/lib/records";

export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
  try{
    requireSameOrigin(req);const {id}=await ctx.params;const {passport,address}=await authorize(id);limitRequests(req,"write-record",20,address);
    const input=await readJson(req);const previous=await readRecords(passport.id);let body:ReturnType<typeof validateRecord>;
    try{body=validateRecord(input,previous);}catch(e){throw new HttpError(400,e instanceof Error?e.message:"Invalid repair record.");}
    const requestKey=req.headers.get("idempotency-key")||randomUUID();if(!/^[a-zA-Z0-9:-]{8,100}$/.test(requestKey))throw new HttpError(400,"Invalid request identifier.");
    const {shareLesson,...fields}=body;
    const fingerprint=createHash("sha256").update(JSON.stringify({address,...body})).digest("hex");
    const candidate:RepairRecord={v:1,id:randomUUID(),passportId:passport.id,...fields,author:address,createdAt:new Date().toISOString()};
    let entry:ReturnType<ReturnType<typeof ledger>["prepare"]>;
    try{entry=ledger().prepare(candidate,requestKey,fingerprint);}catch(e){if(e instanceof Error&&e.message==="IDEMPOTENCY_CONFLICT")throw new HttpError(409,"This request identifier was already used for different content.");throw e;}
    const saved=entry.record.blobId?entry.record:await writeRecord(entry.record,`${passport.make} ${passport.model}`,entry.jobId,entry.attempt);
    let lesson=null,warning:string|undefined;
    if(shareLesson&&saved.outcome==="resolved"&&(saved.kind==="repair"||saved.kind==="followup")&&!canonicalModel(passport.make,passport.model)){warning="Your repair record was saved. Lessons are shared only for catalogue models, so other owners of the same model can match them.";}
    else if(shareLesson&&saved.outcome==="resolved"&&(saved.kind==="repair"||saved.kind==="followup")){
      try{
        const all=effectiveRecords(await readRecords(passport.id));const fixed=all.find(r=>r.id===(saved.kind==="repair"?saved.id:saved.ref));
        if(fixed?.hypothesis){
          const failed=[...new Set(all.filter(r=>r.family===saved.family&&r.kind==="repair"&&r.outcome==="returned"&&r.hypothesis).map(r=>r.hypothesis!))];
          lesson=await writeLesson({v:1,kind:"lesson",family:saved.family,make:passport.make,model:passport.model,symptom:FAMILIES[saved.family].label,failed,fixedBy:fixed.hypothesis,passportId:passport.id,author:address,attested:ledger().attestations(passport.id).some(a=>a.recordId===fixed.id),createdAt:saved.createdAt},`lesson:${saved.id}`);
        }
      }catch{warning="Your repair record was saved. The optional shared lesson could not be published.";}
    }
    return Response.json({record:saved,lesson,warning},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
