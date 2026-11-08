// Usage: node scripts/e2e-view.mjs <addressInSuiKeystore> <passportId> — signs in and prints what that wallet can see.
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"; import { normalizeSuiAddress } from "@mysten/sui/utils";
const BASE = process.env.BASE_URL ?? "http://localhost:3000"; const [who, id] = process.argv.slice(2);
const kp = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".sui", "sui_config", "sui.keystore"), "utf8")).map(b=>Buffer.from(b,"base64")).filter(b=>b[0]===0).map(b=>Ed25519Keypair.fromSecretKey(b.subarray(1))).find(k=>k.toSuiAddress()===normalizeSuiAddress(who));
let cookie=""; const api=async(p,init={})=>{const r=await fetch(BASE+p,{...init,headers:{"content-type":"application/json",origin:BASE,cookie}});const s=r.headers.get("set-cookie");if(s)cookie=s.split(";")[0];const b=await r.json();if(!r.ok)throw new Error(`${p} → ${r.status} ${b.error}`);return b;};
const ch=await api("/api/auth/challenge",{method:"POST",body:JSON.stringify({address:kp.toSuiAddress()})});
const {signature}=await kp.signPersonalMessage(new TextEncoder().encode(ch.message));
await api("/api/auth/verify",{method:"POST",body:JSON.stringify({...ch,signature})});
for (let i=0;i<3;i++){ try { const v=await api(`/api/passport/${id}`); console.log("owner:",v.passport.owner,"| authorized:",v.authorized,"| wasOwner:",v.wasOwner,"| records:",v.records===null?"withheld":v.records.length,"| events:",v.events.map(e=>e.kind).join(",")); break; } catch(e){ console.log("attempt",i+1,e.message); await new Promise(r=>setTimeout(r,3000)); } }
