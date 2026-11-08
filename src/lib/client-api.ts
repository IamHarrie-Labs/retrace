"use client";

/** Consistent deadlines and recoverable errors for every product request. */
export async function requestJson<T>(url:string,init:RequestInit={},timeoutMs=35_000):Promise<T>{
  let response:Response;
  try{response=await fetch(url,{...init,cache:"no-store",signal:init.signal??AbortSignal.timeout(timeoutMs)});}
  catch(e){if(e instanceof Error&&(e.name==="TimeoutError"||e.name==="AbortError"))throw new Error("This request took too long. Please retry; a pending save will reuse its original identifier.");throw new Error("Could not reach Retrace. Check your connection and try again.");}
  let data:T&{error?:string};
  try{data=await response.json();if(!data||typeof data!=="object")throw new Error("Invalid response");}catch{throw new Error("The service returned an unreadable response. Please retry.");}
  if(!response.ok||data.error){
    if(response.status===401&&typeof window!=="undefined")window.dispatchEvent(new Event("retrace:session-expired"));
    throw new Error(data.error||`The request failed (${response.status}). Please retry.`);
  }
  return data;
}
