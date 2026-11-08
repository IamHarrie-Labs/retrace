import { endSession,sessionAddress } from "@/lib/auth";
import { errorResponse,requireSameOrigin } from "@/lib/http";
export async function GET(){try{return Response.json({address:await sessionAddress()},{headers:{"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
export async function DELETE(req:Request){try{requireSameOrigin(req);await endSession();return Response.json({address:null},{headers:{"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
