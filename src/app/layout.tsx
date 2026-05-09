import { getSiteMetadata } from "@/lib/seo";
import { getIndexPageData } from "@/lib/data";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnimationProvider } from "./context/AnimationContext";
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

export async function generateMetadata() {
  return await getSiteMetadata();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { links } = await getIndexPageData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistSans.className} min-h-full flex flex-col bg-white text-slate-900`}>
        <AnimationProvider>          
          <Header links={links} /> 
          <main className="flex-grow">{children}</main>
          <Footer />
        </AnimationProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}