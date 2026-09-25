import { getSiteMetadata } from "@/lib/seo";
import { getIndexPageData } from "@/lib/data";
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
 * Loads the Sanity links and profile once for the header and footer.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { links, profile } = await getIndexPageData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistSans.className} min-h-full flex flex-col bg-white text-slate-900`}>
        <AnimationProvider>          
          <ContactProvider>
            <Header links={links} name={profile?.name} />
            <main className="flex-grow">{children}</main>
            <Footer links={links} />
          </ContactProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}