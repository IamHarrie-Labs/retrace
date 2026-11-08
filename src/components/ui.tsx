"use client";

export const short = (a?: string | null, n = 6) => (a ? `${a.slice(0, n)}…${a.slice(-4)}` : "—");
export const suiscan = {
  object: (id: string) => `https://suiscan.xyz/mainnet/object/${id}`,
  tx: (d: string) => `https://suiscan.xyz/mainnet/tx/${d}`,
  account: (a: string) => `https://suiscan.xyz/mainnet/account/${a}`,
};
export const walruscanBlob = (b: string) => `https://walruscan.com/mainnet/blob/${b}`;

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section data-slot="card" className={`rounded-sm border border-line bg-panel p-6 ${className}`}>{children}</section>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-accent text-accent-ink font-semibold shadow-[0_0_0_1.5px_var(--dark),3px_3px_0_1.5px_var(--dark)] hover:bg-ink",
    ghost: "border-[1.5px] border-ink text-ink hover:bg-raised",
    danger: "border border-warn/50 text-warn hover:bg-warn/10",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export const inputCls =
  "min-h-11 w-full rounded-xl border-[1.5px] border-line bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

export function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "good" | "warn" | "accent" }) {
  const t = {
    muted: "border-line text-muted",
    good: "border-good/40 text-good",
    warn: "border-warn/40 text-warn",
    accent: "border-accent/40 text-accent",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${t}`}>{children}</span>;
}
