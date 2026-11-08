"use client";

import { useEffect, useRef } from "react";

/** Interactive line displacement, rebuilt for a laptop rather than the source's hand. */
export function TraceField({ color = "#26211e", wide = false }: { color?: string; wide?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const host = element?.parentElement;
    const context = element?.getContext("2d");
    if (!element || !host || !context) return;
    let width = 1, height = 1, frame = 0, visible = true;
    const pointer = { x: -1000, y: -1000, strength: 0, target: 0 };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const paused = () => reduced.matches || document.documentElement.dataset.motion === "paused";
    let lines: { x: number; y: number }[][] = [];
    function draw() {
      frame = 0;
      if (!visible) return;
      pointer.strength += (pointer.target - pointer.strength) * .14;
      context!.clearRect(0, 0, width, height);
      context!.strokeStyle = color;
      context!.lineWidth = .95;
      for (const line of lines) {
        context!.beginPath();
        line.forEach((point, index) => {
          const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
          const offset = paused() ? 0 : Math.exp(-(distance * distance) / 9500) * pointer.strength * 30;
          if (index === 0) context!.moveTo(point.x, point.y - offset);
          else context!.lineTo(point.x, point.y - offset);
        });
        context!.stroke();
      }
      if (!paused() && Math.abs(pointer.target - pointer.strength) > .002) frame = requestAnimationFrame(draw);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
    function resize() {
      const rect = host!.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      element!.width = Math.round(width * ratio); element!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      lines = [];
      const size = Math.min(width, height * 1.15);
      for (let y = -45; y < height + 80; y += wide ? 9 : 8) {
        const line = [];
        for (let x = -5; x <= width + 5; x += 5) {
          const u = (x - width * .5) / (size * .5);
          const v = (y - height * .51) / (size * .5);
          const rx = u * .94 + v * .25, ry = v * .94 - u * .25;
          const screen = 1 / (1 + Math.exp(Math.max(Math.abs(rx) - .65, Math.abs(ry + .23) - .43) * 24));
          const keyboard = 1 / (1 + Math.exp(Math.max(Math.abs(rx) - .79, Math.abs(ry - .43) - .16) * 30));
          const depth = wide ? Math.sin(x / width * Math.PI * 3 + y * .009) * 14 : screen * size * .12 + keyboard * size * .055;
          line.push({ x, y: y - depth });
        }
        lines.push(line);
      }
      schedule();
    }
    const move = (event: PointerEvent) => {
      const rect = host!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.target = 1;
      schedule();
    };
    const leave = () => { pointer.target = 0; schedule(); };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); }); visibility.observe(host);
    const motionObserver = new MutationObserver(schedule); motionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    reduced.addEventListener("change", schedule);
    host.addEventListener("pointermove", move); host.addEventListener("pointerleave", leave);
    resize();
    return () => { cancelAnimationFrame(frame); resizeObserver.disconnect(); visibility.disconnect(); motionObserver.disconnect(); reduced.removeEventListener("change", schedule); host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); };
  }, [color, wide]);
  return <canvas ref={canvas} className="trace-canvas" aria-hidden="true" />;
}
