export function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true"><use href="/brand/retrace-mark.svg#mark" /></svg>;
}

export function Brand({ className = "" }: { className?: string }) {
  return <span className={`brand ${className}`}><svg viewBox="0 0 232.524 74" aria-hidden="true"><use href="/brand/retrace-logo.svg#wordmark" /></svg><span className="sr-only">Retrace</span></span>;
}
