"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const faqs: [string, string][] = [
  ["Do I need a wallet to try it?", "The interactive story works without a wallet. Creating or transferring a real passport needs a Sui wallet and your approval, or Google sign-in where it is switched on."],
  ["Does it diagnose my laptop?", "Retrace suggests the next check from recorded symptoms and repair outcomes. A qualified technician still has to assess the hardware."],
  ["What happens when I sell it?", "Send the buyer a claim link. They claim, you transfer in one click, and Retrace checks the new owner through Tatum before serving the history. A copy someone already downloaded can't be erased."],
  ["Who can read the records?", "The current passport holder, and anyone they share a 7-day read-only link with. Records sit in Retrace's operator-managed Walrus Memory account, and the operator can read them."],
  ["What does the evidence prove?", "Roles and evidence are declared by the holder unless a repair shop has signed the record. A storage receipt proves storage; it doesn't prove a repair worked."],
];

// the folder outline: a tab on the top left, rounded body
function folderPath(w: number, h: number) {
  const th = Math.min(40, h / 4), tw = Math.min(150, w * 0.42), tr = 14, r = Math.min(26, w / 6), j = 10;
  return `path('M0 ${tr} A${tr} ${tr} 0 0 1 ${tr} 0 L${tw - tr} 0 A${tr} ${tr} 0 0 1 ${tw} ${tr} L${tw} ${th - j} A${j} ${j} 0 0 0 ${tw + j} ${th} L${w - r} ${th} A${r} ${r} 0 0 1 ${w} ${th + r} L${w} ${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} L${r} ${h} A${r} ${r} 0 0 1 0 ${h - r} Z')`;
}

const stillMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "paused";

function flip(row: Element | null | undefined, delay = 0) {
  if (!row || stillMotion()) return;
  setTimeout(() => row.querySelectorAll(".ff2-flap span").forEach((tile, k) => {
    tile.classList.remove("go"); void (tile as HTMLElement).offsetWidth;
    setTimeout(() => tile.classList.add("go"), k * 90);
  }), delay);
}

export function FolderFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const shape = useRef<HTMLDivElement>(null);
  const sil = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = shape.current;
    if (!el) return;
    const cut = () => { if (sil.current && el.offsetWidth) sil.current.style.clipPath = folderPath(el.offsetWidth, el.offsetHeight); };
    cut();
    const ro = new ResizeObserver(cut);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the number tiles flip in the first time the board comes into view
  useEffect(() => {
    const b = board.current;
    if (!b) return;
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      Array.from(b.children).forEach((row, i) => flip(row, i * 180));
      io.disconnect();
    }, { threshold: 0.3 });
    io.observe(b);
    return () => io.disconnect();
  }, []);

  return (
    <section className="ff2" id="faq" aria-label="Questions and answers">
      <div className="ff2-fold">
        <div className="ff2-shape" ref={shape} aria-hidden="true">
          <div className="ff2-sil" ref={sil}><Image src="/images/photos/thinkpad-keys.jpg" alt="" fill sizes="(max-width:900px) 90vw, 440px" /></div>
        </div>
        <div className="ff2-front">
          <h2>Got questions<span className="qm">?</span></h2>
          <Link href="/proof">See the live Mainnet proof</Link>
        </div>
      </div>
      <div className="ff2-board" ref={board}>
        {faqs.map(([q, a], i) => {
          const isOpen = open === i, n = String(i + 1).padStart(2, "0");
          return (
            <div key={q} className={`ff2-row${isOpen ? " open" : ""}`}>
              <button type="button" className="ff2-btn" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={e => { setOpen(isOpen ? null : i); if (!isOpen) flip(e.currentTarget.parentElement); }}>
                <span className="ff2-flap" aria-hidden="true"><span>{n[0]}</span><span>{n[1]}</span></span>
                <span className="ff2-q">{q}</span>
                <i className="ff2-led" aria-hidden="true" />
              </button>
              <div className="ff2-ex" id={`faq-${i}`} role="region" aria-label={q}><div><div className="ff2-a">{a}</div></div></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
