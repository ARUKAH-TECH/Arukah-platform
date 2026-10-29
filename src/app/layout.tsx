import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// `||` (not `??`) deliberately — Vercel's project-import UI can create this
// var as an empty string rather than leaving it unset, which `??` would not
// catch, and `new URL("")` throws.
// No NEXT_PUBLIC_ prefix: this is only ever read here on the server, never
// in browser-executed code, so it doesn't need to be exposed to the client.
const siteUrl = process.env.SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZIVARUKAH — Technology, Education, Footwear, Media & Books in Ghana",
    template: "%s · ZIVARUKAH",
  },
  description:
    "ZIVARUKAH (Hebrew: ZIVA, the light of God + ARUKAH, total restoration), founded by Shepherd Justice Sarpong Oduro in Ghana: ARUKAH TECH, ARUKAH WEAR, ZIVA Special Classes, ARUKAH MEDIA, ZIVARUKAH BOOKS and Repent Online Ministries.",
  applicationName: "ZIVARUKAH",
  // Search engine ownership codes, if the meta-tag method is used (set in Vercel).
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  openGraph: {
    title: "ZIVARUKAH",
    description: "Creating Solutions. Building Skills. Serving Communities.",
    siteName: "ZIVARUKAH",
    type: "website",
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZIVARUKAH",
    description: "Creating Solutions. Building Skills. Serving Communities.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
