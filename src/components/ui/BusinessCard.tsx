import Image from "next/image";
import Link from "next/link";

interface BusinessCardProps {
  name: string;
  description: string;
  href: string;
  logo: { src: string; width: number; height: number };
  brand: "tech" | "footwear" | "ziva" | "media";
}

export function BusinessCard({ name, description, href, logo, brand }: BusinessCardProps) {
  return (
    <Link
      href={href}
      data-brand={brand === "media" ? undefined : brand}
      className="group flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 transition-colors hover:border-brand-primary-text dark:border-white/10 dark:bg-zinc-900"
    >
      <Image
        src={logo.src}
        alt={`${name} logo`}
        width={56}
        height={56}
        className="h-14 w-14 object-contain"
      />
      <div>
        <h3 className="text-lg font-semibold text-foreground group-hover:text-brand-primary-text">
          {name}
        </h3>
        <p className="mt-1 text-sm leading-6 text-foreground/70">{description}</p>
      </div>
    </Link>
  );
}
