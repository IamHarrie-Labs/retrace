"use client";
import { useCurrentAccount,useDAppKit } from "@mysten/dapp-kit-react";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { createContext,useCallback,useContext,useEffect,useState } from "react";
import { requestJson } from "@/lib/client-api";

type Session={address:string|null;loading:boolean;signingIn:boolean;error:string|null;signIn:()=>Promise<void>;signOut:()=>Promise<void>;needsSignIn:boolean};
const Ctx=createContext<Session|null>(null);
export function SessionProvider({children}:{children:React.ReactNode}){
  const account=useCurrentAccount(),dAppKit=useDAppKit();
  const [address,setAddress]=useState<string|null>(null),[loading,setLoading]=useState(true),[signingIn,setSigningIn]=useState(false),[error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    requestJson<{address:string|null}>("/api/auth/session").then(data=>{if(active)setAddress(data.address);}).catch(()=>{if(active)setAddress(null);}).finally(()=>{if(active)setLoading(false);});
    const expired=()=>{setAddress(null);setError("Your session has expired. Sign in again to continue.");};
    window.addEventListener("retrace:session-expired",expired);
    return()=>{active=false;window.removeEventListener("retrace:session-expired",expired);};
  },[]);
  const signIn=useCallback(async()=>{
    if(!account||signingIn)return;setSigningIn(true);setError(null);
    try{
      const challenge=await requestJson<{address:string;message:string;nonce:string;origin:string;expiresAt:number;token:string}>("/api/auth/challenge",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({address:account.address})});
      const {signature}=await dAppKit.signPersonalMessage({message:new TextEncoder().encode(challenge.message)});
      const session=await requestJson<{address:string}>("/api/auth/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...challenge,signature})});setAddress(session.address);
    }catch(e){setError(e instanceof Error?e.message:"Sign-in failed. Please try again.");}finally{setSigningIn(false);}
  },[account,dAppKit,signingIn]);
  const signOut=useCallback(async()=>{try{await requestJson("/api/auth/session",{method:"DELETE"});setAddress(null);setError(null);}catch(e){setError(e instanceof Error?e.message:"Could not sign out. Please retry.");}},[]);
  const needsSignIn=!!account&&normalizeSuiAddress(account.address)!==address;
  return <Ctx.Provider value={{address:account&&!needsSignIn?address:null,loading,signingIn,error,signIn,signOut,needsSignIn}}>{children}</Ctx.Provider>;
}
export function useSession(){const session=useContext(Ctx);if(!session)throw new Error("useSession outside SessionProvider");return session;}
