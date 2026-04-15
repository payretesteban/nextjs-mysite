import type { Metadata } from "next";
import { settingsQuery } from "@/sanity/lib/queries";
import { Geist, Geist_Mono } from "next/font/google";
import { client } from "@/sanity/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  
const settings = await client.fetch(settingsQuery, {}, { next: { revalidate: 30 } });

  const fallbackTitle = "Esteban Payret | Tech Lead";
  const fallbackDesc = "Software Engineering Manager and Tech Lead.";

  return {
    title: {
      default: settings?.title || fallbackTitle,
      template: `%s | ${settings?.title || "Esteban Payret"}`,
    },
    description: settings?.description || fallbackDesc,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
