import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportWidget } from "@/features/support/SupportWidget";

// Public website chrome. The admin area (src/app/admin) deliberately sits
// outside this group so it never shows the public header, footer, or chat.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <SupportWidget />
    </>
  );
}
