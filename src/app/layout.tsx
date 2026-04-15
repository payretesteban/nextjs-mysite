import type { Metadata } from "next";
import { type SanityDocument } from "next-sanity";
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

const options = { next: { revalidate: 30 } };

const DATA_QUERY = `*[_type == "siteSettings"][0]{ title, description }`;

export async function generateMetadata(): Promise<Metadata> {
  
  const settings = await client.fetch<any>(DATA_QUERY, {}, options);

  console.log("Sanity Metadata Result:", settings);

  return {
    title: {
      default: settings?.title || "Esteban Payret | Tech Lead",
      template: "%s | Esteban Payret",
    },
    description: settings?.description || "Software Engineering Manager and Tech Lead.",
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
