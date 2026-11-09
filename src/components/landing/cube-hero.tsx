"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Play } from "@phosphor-icons/react";
import { Brand } from "../brand";

type Chapter = { name: string; record: string; verb: string; note: string; next: string; img?: string; alt?: string };

const chapters: Chapter[] = [
  { name: "The symptom", record: "Symptom", verb: "Know", note: "Charging stops when the cable moves.", next: "Log the symptom", img: "/images/photos/thinkpad-on-desk.jpg", alt: "A Lenovo ThinkPad open on a desk" },
  { name: "The repair", record: "Repair", verb: "Keep", note: "Battery replaced. The fault came back after 21 days.", next: "Record the outcome", img: "/images/photos/thinkpad-inside.jpg", alt: "Inside a ThinkPad T470p with the bottom cover removed" },
  { name: "The lesson", record: "Lesson", verb: "Learn", note: "A new battery and a known-good charger didn’t fix it. Check the DC jack.", next: "Inspect the DC jack", img: "/images/photos/thinkpad-board.jpg", alt: "A ThinkPad X220 motherboard inside its case" },
  { name: "The handover", record: "Handover", verb: "Pass", note: "The buyer gets the passport with every repair already in it.", next: "Send a claim link" },
];

const WORD_SECONDS = 3.5;
const REST_ANGLE = 22;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const still = () => typeof window !== "undefined" && (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "paused");

export function CubeHero() {
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [tipGone, setTipGone] = useState(false);
  const mid = useRef<HTMLDivElement>(null);
  const cube = useRef<HTMLDivElement>(null);
  const faces = useRef<(HTMLElement | null)[]>([]);
  const left = useRef<HTMLParagraphElement>(null);
  const right = useRef<HTMLParagraphElement>(null);
  const kickRef = useRef<() => void>(() => {});
  const stage = useRef<HTMLDivElement>(null);
  const st = useRef({ A: 0, T: 0, v: 0, drag: false, mx: 0, my: 0, tx: 0, ty: 0, last: 0, step: 0, lastX: 0, lastT: 0, downX: 0, downY: 0, downT: 0 });

  const goTo = useCallback((i: number) => {
    const s = st.current, cur = s.step;
    let d = mod(i - cur, 4);
    if (d > 2) d -= 4;
    s.T = -90 * (cur + d);
  }, []);

  // the word swap: flip the tickets out, change the words, pop them back in, squash the cube as it lands
  useEffect(() => {
    if (step === shown) return;
    const out = setTimeout(() => setSwapping(true), 0);
    const t = setTimeout(() => {
      setShown(step);
      setSwapping(false);
      if (still()) return;
      [left.current, right.current].forEach(el => { if (!el) return; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); });
      const m = mid.current; if (m) { m.classList.remove("land"); void m.offsetWidth; m.classList.add("land"); }
    }, 240);
    return () => { clearTimeout(out); clearTimeout(t); };
  }, [step, shown]);

  useEffect(() => {
    const s = st.current, m = mid.current, c = cube.current;
    if (!m || !c) return;
    if (still()) s.A = 0;
    let raf = 0, visible = true;
    const render = () => {
      const ang = s.A + REST_ANGLE + s.tx * 18;
      const rx = -11 - s.ty * 10;
      c.style.transform = `translateZ(${-m.clientWidth / 2}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ang.toFixed(2)}deg)`;
      faces.current.forEach((f, k) => {
        if (!f) return;
        const cos = Math.cos(((ang + k * 90) * Math.PI) / 180);
        const shade = f.querySelector<HTMLElement>(".ch-shade");
        if (shade) shade.style.opacity = clamp((1 - cos) * 0.32, 0, 0.55).toFixed(3);
        f.style.visibility = cos < -0.05 ? "hidden" : "visible";
      });
    };
    const tick = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) { s.last = 0; return; }
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 0;
      s.last = now;
      if (!s.drag) { s.v += ((s.T - s.A) * 60 - s.v * 11) * dt; s.A += s.v * dt; }
      const k = Math.min(1, dt * 5);
      s.tx += (s.mx - s.tx) * k; s.ty += (s.my - s.ty) * k;
      const next = mod(Math.round(-s.A / 90), 4);
      if (next !== s.step) { s.step = next; setStep(next); }
      render();
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { s.last = 0; start(); } });
    io.observe(m);
    const timer = setInterval(() => { if (!s.drag && visible && !document.hidden && !still()) { s.T -= 90; start(); } }, WORD_SECONDS * 1000);
    const onVis = () => { if (!document.hidden) { s.last = 0; start(); } };
    document.addEventListener("visibilitychange", onVis);
    start();
    kickRef.current = start;
    return () => { cancelAnimationFrame(raf); io.disconnect(); clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const kick = () => kickRef.current();
  const onMove = (e: React.PointerEvent) => {
    const s = st.current;
    if (e.pointerType === "mouse" && stage.current) {
      const r = stage.current.getBoundingClientRect();
      s.mx = ((e.clientX - r.left) / r.width - 0.5) * 2; s.my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    }
    if (!s.drag || !mid.current) return;
    const now = performance.now(), dA = ((e.clientX - s.lastX) * 180) / Math.max(300, mid.current.clientWidth * 2.2);
    s.A += dA;
    const dt = Math.max(0.008, (now - s.lastT) / 1000);
    s.v = s.v * 0.5 + (dA / dt) * 0.5; s.lastX = e.clientX; s.lastT = now;
  };
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const s = st.current;
    Object.assign(s, { drag: true, lastX: e.clientX, lastT: performance.now(), v: 0, downX: e.clientX, downY: e.clientY, downT: performance.now() });
    mid.current?.classList.add("drag");
    try { stage.current?.setPointerCapture(e.pointerId); } catch {}
  };
  const onUp = (e: React.PointerEvent) => {
    const s = st.current;
    if (!s.drag) return;
    s.drag = false; mid.current?.classList.remove("drag");
    const tap = e.type === "pointerup" && Math.abs(e.clientX - s.downX) < 6 && Math.abs(e.clientY - s.downY) < 6 && performance.now() - s.downT < 400;
    if (tap) { s.T = Math.round(s.A / 90) * 90 - 90; setTipGone(true); }
    else s.T = Math.round((s.A + clamp(s.v, -900, 900) * 0.18) / 90) * 90;
    s.v = 0; s.last = 0; kick();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const s = st.current;
    if (e.key === "ArrowRight") { s.T -= 90; e.preventDefault(); }
    else if (e.key === "ArrowLeft") { s.T += 90; e.preventDefault(); }
    else return;
    setTipGone(true); kick();
  };

  const ch = chapters[shown];
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <section className="ch" id="top" aria-label="A laptop's repair story in four chapters">
      <div className="ch-stage" ref={stage} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={() => { st.current.mx = 0; st.current.my = 0; }}>
        <div className="ch-intro">
          <h1>Know what&rsquo;s been tried before you try it again.</h1>
          <p>Retrace keeps a record of every fix a laptop gets, and whether it worked. The next repair starts from there, and when you sell the laptop, the buyer gets the record too.</p>
          <div className="ch-row">
            <Link href="/devices" className="pebble-btn">Start a passport<span className="peb" aria-hidden="true"><ArrowRight size={22} weight="bold" /></span></Link>
            <Link href="/demo" className="ch-alt">See an example</Link>
          </div>
          <span className="ch-tip" style={{ opacity: tipGone ? 0 : undefined }}>Drag or tap the cube to turn it</span>
        </div>

        <p ref={left} className={`ch-side ch-left${swapping ? " out" : ""}`} aria-hidden="true"><span className="lbl">the record</span><span className="ch-word">{ch.record}</span></p>
        <p ref={right} className={`ch-side ch-right${swapping ? " out" : ""}`} aria-hidden="true"><span className="lbl">what it does</span><span className="ch-word">{ch.verb}</span></p>

        <div className="ch-mid" ref={mid} tabIndex={0} role="group" aria-roledescription="carousel" aria-label={`${ch.name}, chapter ${shown + 1} of 4. Use the arrow keys to turn.`} onPointerDown={onDown} onKeyDown={onKey}>
          <div className="ch-floor" />
          <div className="ch-cube" ref={cube}>
            {chapters.map((c, i) => (
              <figure key={c.name} className="ch-face" ref={el => { faces.current[i] = el; }} style={{ transform: `rotateY(${i * 90}deg) translateZ(calc(var(--cube) / 2))`, margin: 0 }}>
                <div className="ch-pic">
                  {c.img ? <Image src={c.img} alt={c.alt ?? ""} fill sizes="(max-width:900px) 56vw, 26vw" priority={i === 0} draggable={false} /> : (
                    <div className="ch-pass"><Brand /><div className="chip" /><dl><div><dt>Device</dt><dd>ThinkPad T480</dd></div><div><dt>Records</dt><dd>4 on Walrus</dd></div><div><dt>Owner</dt><dd>A → B</dd></div></dl></div>
                  )}
                </div>
                <figcaption><span>{c.name}</span><span>{num(i)}/04</span></figcaption>
                <span className="ch-shade" />
              </figure>
            ))}
          </div>
          <Link href="/demo" className={`ch-say${swapping ? " sw" : ""}`} onPointerDown={e => e.stopPropagation()}>
            <span className="pl" aria-hidden="true"><Play size={15} weight="fill" /></span>
            <span><small>Next check</small><b>{ch.next}</b></span>
          </Link>
        </div>

        <div className={`ch-meta${swapping ? " sw" : ""}`} aria-live="polite">
          <p className="m1">{ch.note}</p>
          <p className="m2">ThinkPad T480 · chapter {num(shown)} of 04</p>
        </div>

        <div className="ch-dots" role="group" aria-label="Story chapters" onPointerDown={e => e.stopPropagation()}>
          {chapters.map((c, i) => <button key={c.name} type="button" aria-label={c.name} aria-pressed={shown === i} onClick={() => { goTo(i); setTipGone(true); kick(); }}>{num(i)}</button>)}
        </div>
      </div>
    </section>
  );
}
