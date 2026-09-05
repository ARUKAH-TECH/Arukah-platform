import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportWidget } from "@/features/support/SupportWidget";
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
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ARUKAH",
    template: "%s · ARUKAH",
  },
  description: "Creating Solutions. Building Skills. Serving Communities.",
  openGraph: {
    title: "ARUKAH",
    description: "Creating Solutions. Building Skills. Serving Communities.",
    siteName: "ARUKAH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ARUKAH",
    description: "Creating Solutions. Building Skills. Serving Communities.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <SupportWidget />
      </body>
    </html>
  );
}
