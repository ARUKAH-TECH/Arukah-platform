import type { Metadata, Viewport } from "next";
import { AdminAppSetup } from "@/features/admin/AdminApp";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · ZIVARUKAH Admin" },
  robots: { index: false, follow: false },
  // Installable "ZIVARUKAH Admin" app on phones (public/admin.webmanifest).
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "ZIV Admin", statusBarStyle: "default" },
  icons: { apple: "/admin-icons/apple-180.png" },
};

export const viewport: Viewport = { themeColor: "#001a4d" };

// Deliberately bare: no public header/footer/chat, and nothing here reveals
// admin features — each page checks access itself (see src/server/auth.ts).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div data-admin className="flex min-h-full flex-1 flex-col text-foreground">
      <AdminAppSetup />
      {children}
    </div>
  );
}
