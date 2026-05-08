import { getSiteMetadata } from "@/lib/seo";
import { getIndexPageData } from "@/lib/data";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnimationProvider } from "./context/AnimationContext";
import { animationsQuery } from "@/sanity/lib/queries";
import { client } from "@/sanity/client";

import Header from "./header";
import Footer from "./footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
  return await getSiteMetadata();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { links } = await getIndexPageData();
  const animations = await client.fetch(animationsQuery);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <AnimationProvider>
          <Header links={links} animations={animations} />

          <main className="flex-grow">{children}</main>

          <Footer />
        </AnimationProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}