import Image from "next/image";
import { brands } from "@/config/brands";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  const logo = brands.arukah.logo;
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-[var(--admin-navy)] via-[var(--admin-blue)] to-[var(--background)] px-4 py-16">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 border-t-4 border-t-[var(--admin-gold)] bg-white p-8 shadow-md dark:border-white/10 dark:bg-zinc-900">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src={logo.src} alt="" width={64} height={(64 * logo.height) / logo.width} />
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
