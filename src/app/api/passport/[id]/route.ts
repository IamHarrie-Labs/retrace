import { sessionAddress } from "@/lib/auth";
import { errorResponse,loadPassport,validShare } from "@/lib/access";
import { readAttestations,readRecords } from "@/lib/memory";
import { followupsDue,publicSummary } from "@/lib/summary";
import { getPassport,getPassportEvents } from "@/lib/tatum";
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){
  try{
    const {id}=await ctx.params;const share=new URL(req.url).searchParams.get("share");
    let passport=await loadPassport(id);const address=await sessionAddress();const events=await getPassportEvents(passport.id);
    let authorized=!!address&&passport.ownerKind==="address"&&passport.owner===address;
    if(authorized){const current=await getPassport(passport.id,{fresh:true});if(!current||current.ownerKind!=="address"||current.owner!==address){authorized=false;if(current)passport=current;}}
    const shared=!authorized&&validShare(share,passport);
    // Every visitor gets the public pre-purchase summary (counts and status, no notes).
    const all=await readRecords(passport.id);const attestations=await readAttestations(passport,all);
    const summary=publicSummary(all,events.filter(e=>e.kind==="transferred").length,new Set(attestations.map(a=>a.recordId)));
    const full=authorized||shared;
    return Response.json({passport,events,viewer:address,authorized,shared,wasOwner:!!address&&!authorized&&events.some(event=>event.to===address),
      summary,records:full?all:null,attestations:full?attestations.map(({message:_m,signature:_s,...a})=>a):null,followupsDue:authorized?followupsDue(all):null},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(e){return errorResponse(e);}
}
