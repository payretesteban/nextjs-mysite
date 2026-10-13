import { getSiteMetadata } from "@/lib/seo";
import { getLayoutData } from "@/lib/data";
import { Geist, Geist_Mono, VT323 } from "next/font/google";
import { themeInitScript } from "@/lib/themes";
import { AnimationProvider } from "./context/AnimationContext";
import ContactProvider from "./contact/ContactProvider";
import Header from "./header";
import Footer from "./footer";
import SeasonalNudge from "./theme/SeasonalNudge";
import ThemeDecorations from "./theme/ThemeDecorations";
import "./globals.css";

// The Retro theme's terminal font: only downloaded when that theme is on (not preloaded)
const vt323 = VT323({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-vt323", preload: false });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Preloaded: the <EP/> logo in the header uses it, so it's needed for the very first paint.
// (In `npm run dev` Chrome may still say it was "preloaded but not used"; dev pages paint slowly. Not on the live site.)
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Next.js metadata for every page (title, description, social cards), loaded from Sanity. */
export async function generateMetadata() {
  return await getSiteMetadata();
}

/**
 * Root layout: fonts, animation and contact providers, header and footer.
 * Loads only the Sanity links and owner's name for the header and footer (and never fails: see getLayoutData).
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { links, name } = await getLayoutData();

  return (
    // suppressHydrationWarning: the head script sets data-theme/data-mode before React loads
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved theme and light/dark choice before the first paint (no flash) */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className={`${geistSans.className} min-h-full flex flex-col bg-white text-slate-900`}>
        <AnimationProvider>          
          <ContactProvider>
            <Header links={links} name={name ?? undefined} />
            <main className="flex-grow">{children}</main>
            <Footer links={links} />
            <ThemeDecorations />
            <SeasonalNudge />
          </ContactProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}