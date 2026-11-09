"use client";

import Link from "next/link";
import { WalletConnect } from "./wallet-connect";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, List, X } from "@phosphor-icons/react";
import { Brand } from "./brand";
import { useSession } from "./session";
import { Button, short } from "./ui";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/demo", label: "See an example" },
  { href: "/devices", label: "My devices" },
  { href: "/proof", label: "Proof" },
];

export function Header() {
  const s = useSession();
  const path = usePathname();
  const walletRoute = path === "/devices" || path.startsWith("/passport/") || path.startsWith("/claim/") || path.startsWith("/attest/");
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const current = (href: string) => (path === href || (href !== "/" && !href.includes("#") && path.startsWith(href + "/")) ? "page" : undefined);
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <header className="rh">
      <div className="rh-bar">
        <button ref={menuButton} className="rh-burger rh-cell" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)}>{open ? <X size={24} /> : <List size={24} />}</button>
        <Link href="/" aria-label="Retrace home" className="rh-cell rh-logo" onClick={() => setOpen(false)}><Brand /></Link>
        <nav className="rh-nav" aria-label="Main navigation">
          {links.map((l, i) => <Link key={l.href} href={l.href} className="rh-cell" aria-current={current(l.href)}>{l.label}<span className="num" aria-hidden="true">{num(i)}</span></Link>)}
        </nav>
      </div>
      <div className="rh-actions">
        {walletRoute ? (
          <div className="rh-wallet">
            <WalletConnect />
            {s.needsSignIn && <Button onClick={s.signIn} disabled={s.signingIn}>{s.signingIn ? "Check wallet…" : "Sign in"}</Button>}
            {s.address && !s.needsSignIn && <button className="session-control" onClick={s.signOut} title={`Sign out of ${short(s.address)}`}>Sign out</button>}
          </div>
        ) : (
          <Link href="/devices" className="rh-cta">Start a passport<span className="peb" aria-hidden="true"><ArrowRight size={22} weight="bold" /></span></Link>
        )}
      </div>
      {open && <nav id="mobile-nav" className="rh-mobile-nav" aria-label="Mobile navigation">{links.map((l, i) => <Link key={l.href} href={l.href} aria-current={current(l.href)} onClick={() => setOpen(false)}>{l.label}<span className="num" aria-hidden="true">{num(i)}</span></Link>)}</nav>}
      {s.error && <p role="alert" className="session-error">{s.error}</p>}
    </header>
  );
}
