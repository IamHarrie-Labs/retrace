import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Brand, BrandMark } from "@/components/brand";

export const metadata = { title: "Brand assets" };

const palette = [
  { name: "Wine", hex: "#6E1F36", ink: "#FDF7F1", use: "Primary actions, headings" },
  { name: "Dark", hex: "#3A1220", ink: "#FDF7F1", use: "Text, outlines, shadows" },
  { name: "Rose", hex: "#F2C6CD", ink: "#3A1220", use: "Tickets, highlights" },
  { name: "Blush", hex: "#F9E3E0", ink: "#3A1220", use: "Panels, notes" },
  { name: "Cream", hex: "#FDF7F1", ink: "#3A1220", use: "Page background" },
  { name: "Ochre", hex: "#DC942F", ink: "#3A1220", use: "The dot in the wordmark only" },
];

const photos = [
  { file: "MacBook Pro on a wooden desk", by: "Kari Shea", lic: "Unsplash License", href: "https://unsplash.com/photos/1SAnrIxw5OY" },
  { file: "Technician inside a MacBook Pro", by: "Revendo", lic: "Unsplash License", href: "https://unsplash.com/photos/7x0dGJqbfgk" },
  { file: "MacBook Pro logic board", by: "Nikolai Chernichenko", lic: "Unsplash License", href: "https://unsplash.com/photos/VVqk1YRrEmE" },
  { file: "Silver MacBook", by: "Maxim Hopman", lic: "Unsplash License", href: "https://unsplash.com/photos/Hin-rzhOdWs" },
  { file: "MacBook Air on a wooden table", by: "Yudhajit Ghosh", lic: "Unsplash License", href: "https://unsplash.com/photos/WGFQscKlxgQ" },
  { file: "Technician repairing a MacBook", by: "Revendo", lic: "Unsplash License", href: "https://unsplash.com/photos/M7_rJ4LF-jk" },
  { file: "MacBook keyboard", by: "Kamil Switalski", lic: "Unsplash License", href: "https://unsplash.com/photos/p3aS1QBhm7g" },
  { file: "MacBook Pro next to a plant", by: "James McKinven", lic: "Unsplash License", href: "https://unsplash.com/photos/tpuAo8gVs58" },
];

export default function BrandPage() {
  return (
    <div className="brand-page">
      <div className="page-heading">
        <p className="eyebrow">Brand assets</p>
        <h1>Logo, colours<br /><em>and type.</em></h1>
        <p>Everything Retrace pages are built from. Download the logo, copy the colour values, and if you reuse a photo, credit the photographer listed below.</p>
      </div>

      <div className="brand-board"><Brand /></div>
      <div className="brand-actions">
        <a className="action-button" href="/brand/retrace-logo.svg" download="retrace-logo.svg">Wordmark SVG <ArrowDown size={18} /></a>
        <a className="action-button" href="/brand/retrace-mark.svg" download="retrace-mark.svg">Symbol SVG <ArrowDown size={18} /></a>
        <span className="brand-mark-chip"><BrandMark /></span>
      </div>

      <h2 className="brand-h2">Colour</h2>
      <div className="brand-palette">
        {palette.map(c => <div key={c.name} style={{ background: c.hex, color: c.ink }}><strong>{c.name}</strong><span>{c.use}</span><code>{c.hex}</code></div>)}
      </div>

      <h2 className="brand-h2">Type</h2>
      <div className="brand-type">
        <section><span className="eyebrow">Display · Faculty Glyphic</span><p className="brand-type-display">Know what&rsquo;s been tried.</p><p className="brand-type-note">Headlines, ticket words, big numbers. One weight, never italic.</p></section>
        <section><span className="eyebrow">Interface · Geist</span><p className="brand-type-ui">Every symptom, repair and outcome stays tied to the laptop.</p><p className="brand-type-note">Body copy, buttons, labels. Geist Mono only for IDs and step numbers: <code>0xcf67…bcb3</code></p></section>
      </div>

      <h2 className="brand-h2" id="photo-credits">Photo credits</h2>
      <ul className="brand-credits">
        {photos.map(p => <li key={p.href}><span>{p.file}</span><span>{p.by}</span><a href={p.href} target="_blank" rel="noreferrer">{p.lic} <ArrowUpRight size={14} /></a></li>)}
      </ul>
      <p className="brand-type-note">Every photo shows a real Apple MacBook. The example story follows a MacBook Pro 13; Retrace works the same way for any laptop on the list. Images are resized only.</p>
      <Link href="/" className="text-link mt-6">Back to the homepage <ArrowUpRight size={17} /></Link>
    </div>
  );
}
