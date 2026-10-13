import { getSiteMetadata } from "@/lib/seo";
import { getLayoutData } from "@/lib/data";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnimationProvider } from "./context/AnimationContext";
import ContactProvider from "./contact/ContactProvider";
import Header from "./header";
import Footer from "./footer";
import "./globals.css";

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
 * Root layout: fonts, animation and contact providers, header, footer and speed insights.
 * Loads only the Sanity links and owner's name for the header and footer (and never fails: see getLayoutData).
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { links, name } = await getLayoutData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistSans.className} min-h-full flex flex-col bg-white text-slate-900`}>
        <AnimationProvider>          
          <ContactProvider>
            <Header links={links} name={name ?? undefined} />
            <main className="flex-grow">{children}</main>
            <Footer links={links} />
          </ContactProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}