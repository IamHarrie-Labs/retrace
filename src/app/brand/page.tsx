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
  { file: "ThinkPad on a desk", by: "l ch", lic: "Unsplash License", href: "https://unsplash.com/photos/AuMob2xihZk" },
  { file: "ThinkPad on a wooden table", by: "Eddie Sennov", lic: "Unsplash License", href: "https://unsplash.com/photos/Tiy7aJwWPvc" },
  { file: "ThinkPad keyboard and TrackPoint", by: "Ke Wn", lic: "Unsplash License", href: "https://unsplash.com/photos/dYrx9CELZ_A" },
  { file: "Inside a ThinkPad T470p", by: "Kenming Wang", lic: "CC BY-SA 2.0", href: "https://commons.wikimedia.org/wiki/File:Thinkpad_T470p_(35786843930).jpg" },
  { file: "ThinkPad X220 motherboard in its case", by: "Siarhei Besarab", lic: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Fully_equipped_Lenovo_ThinkPad_X220_motherboard_with_keyboard_bezel.jpg" },
  { file: "ThinkPad X220 fan and heatsink", by: "Siarhei Besarab", lic: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:ThinkPad_X220_CPU_cooling_system_(fan_and_heatsink_assembly).jpg" },
  { file: "Lenovo ThinkPad T470", by: "NickW1129", lic: "CC0", href: "https://commons.wikimedia.org/wiki/File:Lenovo_ThinkPad_T470.jpg" },
];

export default function BrandPage() {
  return (
    <div className="brand-page">
      <div className="page-heading">
        <p className="eyebrow">Brand assets</p>
        <h1>One mark.<br /><em>One voice.</em></h1>
        <p>The wordmark, colours and type that every Retrace page uses. Download the vectors, copy the values, and credit the photographers below if you reuse their images.</p>
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
      <p className="brand-type-note">Every photo shows a real Lenovo ThinkPad. The sample story follows a ThinkPad T480; photos of sibling models are labelled with their model. Images are resized only.</p>
      <Link href="/" className="text-link mt-6">Back to the homepage <ArrowUpRight size={17} /></Link>
    </div>
  );
}
