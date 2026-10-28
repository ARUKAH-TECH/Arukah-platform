import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportWidget } from "@/features/support/SupportWidget";
import { PageViewTracker } from "@/features/analytics/PageViewTracker";
import { HousePopup } from "@/features/ads/HousePopup";

// Public website chrome. The admin area (src/app/admin) deliberately sits
// outside this group so it never shows the public header, footer, or chat.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="reveal-sections flex flex-1 flex-col">{children}</main>
      <Footer />
      <SupportWidget />
      <PageViewTracker />
      <HousePopup />
    </>
  );
}
