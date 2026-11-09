"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowUp, Pause, Play } from "@phosphor-icons/react";
import { Brand } from "./brand";
import { useBrowserStorage } from "@/lib/browser-storage";

export function Footer() {
  const [stored, setStored] = useBrowserStorage("retrace-motion-paused");
  const paused = stored === "true";
  useEffect(() => { document.documentElement.dataset.motion = paused ? "paused" : "playing"; }, [paused]);
  return (
    <footer className="pf">
      <div className="pf-top">
        <p>A little history.<br />A longer life.</p>
        <div><h3>Use it</h3><nav aria-label="Product"><Link href="/devices">My devices</Link><Link href="/demo">See an example</Link><Link href="/#faq">Questions</Link></nav></div>
        <div><h3>Check it</h3><nav aria-label="Proof"><Link href="/proof">Mainnet proof</Link><Link href="/brand">Brand assets</Link><Link href="/brand#photo-credits">Photo credits</Link><Link href="/privacy">Privacy and data</Link><button onClick={() => setStored(String(!paused))}>{paused ? <Play size={14} /> : <Pause size={14} />} {paused ? "Play motion" : "Pause motion"}</button></nav></div>
        <button className="back-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: paused || matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}><ArrowUp size={26} weight="bold" /></button>
      </div>
      <Link href="/" className="pf-word" aria-label="Retrace home"><Brand /></Link>
      <div className="pf-bottom"><span>Repairs stored on Walrus · ownership on Sui, read through Tatum</span><span>Built for Total Recall, {new Date().getFullYear()}</span></div>
    </footer>
  );
}
