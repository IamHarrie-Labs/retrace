"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const faqs: [string, string][] = [
  ["Do I need a wallet to try it?", "No. The example on this site runs without one. To register a real laptop or hand one over, you need a Sui wallet, or Google sign-in where it's turned on."],
  ["Does it diagnose my laptop?", "It tells you what to check next, based on the symptoms and on which repairs worked or failed. It can't see inside your laptop, so a technician still needs to look at it."],
  ["What happens when I sell it?", "You send the buyer a link. They open it and sign in, then you approve the transfer. From then on only the buyer can see the full history. If someone downloaded a copy before the sale, they still have it."],
  ["Who can read the records?", "You can, while you own the laptop, and so can anyone you send a 7-day read-only link to. The records are kept in a Walrus Memory account that Retrace runs, so Retrace can read them too."],
  ["Can I trust what a record says?", "As far as you trust the person who wrote it. Owners fill in their own records, and Retrace marks those as reported. A record signed by a repair shop shows the shop's name. Walrus proves when a record was saved and that it hasn't been changed since."],
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
          <div className="ff2-sil" ref={sil}><Image src="/images/photos/macbook-keyboard.jpg" alt="" fill style={{ objectPosition: "center bottom" }} sizes="(max-width:900px) 90vw, 440px" /></div>
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
