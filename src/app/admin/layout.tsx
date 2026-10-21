import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · ZIVARUKAH Admin" },
  robots: { index: false, follow: false },
};

// Deliberately bare: no public header/footer/chat, and nothing here reveals
// admin features — each page checks access itself (see src/server/auth.ts).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-black/[0.03] dark:bg-white/[0.03]">{children}</div>;
}
