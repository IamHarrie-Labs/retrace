import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CubeHero } from "@/components/landing/cube-hero";
import { BoardingPasses } from "@/components/landing/boarding-passes";
import { FolderFaq } from "@/components/landing/folder-faq";
import { LiveBand } from "@/components/landing/live-band";

export default function Home() {
  return (
    <div className="landing print">
      <CubeHero />
      <LiveBand />
      <BoardingPasses />
      <FolderFaq />
      <section className="lc">
        <h2>Give the next repair a better starting point.</h2>
        <Link href="/devices" className="pebble-btn">Start a passport<span className="peb" aria-hidden="true"><ArrowRight size={22} weight="bold" /></span></Link>
      </section>
    </div>
  );
}
