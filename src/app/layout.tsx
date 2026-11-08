import type { Metadata } from "next";
import localFont from "next/font/local";
import { Faculty_Glyphic } from "next/font/google";
import "./globals.css";
import "./print.css";
import { Providers } from "@/components/providers";
import { SessionProvider } from "@/components/session";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const geistSans = localFont({ src: "../../public/fonts/Geist-Variable.ttf", variable: "--font-geist-sans", weight: "100 900", display: "swap" });
const geistMono = localFont({ src: "../../public/fonts/GeistMono-Variable.ttf", variable: "--font-geist-mono", weight: "100 900", display: "swap" });
const glyphic = Faculty_Glyphic({ subsets: ["latin"], weight: "400", variable: "--font-glyphic", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Retrace · A little history. A longer life.", template: "%s · Retrace" },
  description: "Know what's been tried before you try it again. Device repair history on Walrus Memory, ownership on Sui via Tatum.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} ${glyphic.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <SessionProvider>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <Header />
            <main id="main-content" className="site-main">{children}</main>
            <Footer />
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
