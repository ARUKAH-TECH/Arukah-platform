import type { Metadata } from "next";
import { BibleAppSetup } from "@/features/bible/BibleApp";

// Every Bible page belongs to the installable "ZIVARUKAH Bible" app (public/bible.webmanifest).
export const metadata: Metadata = { manifest: "/bible.webmanifest" };

export default function BibleLayout({ children }: LayoutProps<"/bible">) {
  return (
    <>
      <BibleAppSetup />
      {children}
    </>
  );
}
