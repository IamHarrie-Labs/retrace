import { z } from "zod";
import { authorizeRead,errorResponse } from "@/lib/access";
import { readRecords,recallLessons } from "@/lib/memory";
import { classifySymptom,diagnose,learningTimeline } from "@/lib/diagnose";
import { HttpError,limitRequests,readJson,requireSameOrigin } from "@/lib/http";
import { getPassport } from "@/lib/tatum";
const Input=z.object({symptom:z.string().trim().min(3).max(400),family:z.enum(["charging","thermal","display"]).optional(),share:z.string().max(2048).optional()}).strict();
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
  try{
    requireSameOrigin(req);const {id}=await ctx.params;const body=Input.parse(await readJson(req));
    const {passport,address,via}=await authorizeRead(id,body.share);limitRequests(req,"diagnose",30,address??undefined);
    const family=body.family??classifySymptom(body.symptom);const records=await readRecords(passport.id);
    let lessons:Awaited<ReturnType<typeof recallLessons>>=[],warning:string|undefined;
    try{lessons=(await recallLessons(family,passport.make,passport.model,body.symptom)).filter(lesson=>lesson.passportId!==passport.id);}catch{warning="Shared model lessons are unavailable. This comparison uses the complete device history only.";}
    if(via==="owner"&&(await getPassport(passport.id,{fresh:true}))?.owner!==address)throw new HttpError(403,"This passport changed hands. Your access has ended.");
    return Response.json({family,warning,
      withoutMemory:diagnose({family,records:[],memory:false,symptom:body.symptom}),
      withMemory:diagnose({family,records,lessons,memory:true,symptom:body.symptom}),
      timeline:learningTimeline(family,records,body.symptom)},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorResponse(e);}
}
