export function DeviceDiagram({ kind }: { kind: "passport" | "record" | "learn" | "transfer" }) {
  return <svg data-service-model className={`device-diagram diagram-${kind}`} viewBox="0 0 280 250" fill="none" aria-hidden="true">
    <g className="diagram-object" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      {kind === "passport" && <><path d="m67 58 106-28 43 151-106 29z" fill="var(--bg)"/><path d="m76 65 90-24 37 131-90 24z"/><path d="m112 87 37-10 10 37-37 10z"/><path d="m123 130 47-13m-44 23 47-13m-45 23 47-13"/><path d="m120 162 22-6 5 19-22 6z"/><path d="m167 153 14-4m-12 12 14-4m-12 12 14-4"/><path d="m67 58-9 8 43 151 9-7m-9 7 106-28 9-8"/><circle cx="140" cy="96" r="7"/><path d="m128 114 2-7 7-2"/></>}
      {kind === "record" && <><path d="m54 99 89-43 88 44-89 45z" fill="var(--bg)"/><path d="M54 99v20l88 45 89-44v-20m-89 45v19"/><path d="m54 132 88 44 89-44v21l-89 45-88-44z" fill="var(--bg)"/><path d="m54 165 88 44 89-44v20l-89 45-88-44z" fill="var(--bg)"/><path d="m89 98 53-26 53 27-53 27z"/><path d="m142 176 1 22m-1 11v21"/><path d="m110 99 21 10 40-20"/></>}
      {kind === "learn" && <><path d="m68 70 143 25-25 137-143-25z" fill="var(--bg)"/><path d="m87 47 143 25-25 137-143-25z" fill="var(--bg)"/><path d="m104 24 143 25-25 137-143-25z" fill="var(--bg)"/><path d="m124 61 89 16m-92-1 89 16m-92-1 89 16m-92-1 89 16"/><path d="m114 130 22 4 4-19 31 5 5-29 22 4" strokeWidth="3"/><circle cx="114" cy="130" r="4" fill="currentColor"/><circle cx="198" cy="95" r="4" fill="currentColor"/></>}
      {kind === "transfer" && <><path d="m42 100 65-33 61 32-65 32z" fill="var(--bg)"/><path d="M42 100v62l61 32 65-33V99m-65 32v63"/><path d="m112 70 65-33 61 32-65 32z" fill="var(--bg)"/><path d="M112 70v62l61 32 65-33V69m-65 32v63"/><path d="M69 51c28-25 65-25 95-7m-14-22 14 22-25 4M210 185c-30 26-67 26-96 8m13 23-13-23 25-4" strokeWidth="2.5"/><path d="m133 69 40 20 43-21"/></>}
    </g>
  </svg>;
}
