import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LITERACY_URL } from "@/config/literacy";

/** A bright card that sends visitors to the literacy app (used on the homepage and ZIVA page). */
export function LiteracyPromo() {
  return (
    <section className="py-12">
      <Container>
        <div className="flex flex-col gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b69a8] to-[#0b3d91] p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-10">
          <Image
            src="/branding/ziva-literacy/logo.webp"
            alt="ZIVA Literacy logo"
            width={128}
            height={128}
            className="h-28 w-28 shrink-0 rounded-full bg-white shadow-xl ring-4 ring-white/30 sm:h-32 sm:w-32"
          />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f0c050]">New · Free</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">ZIVA Literacy &amp; Handwriting Coach</h2>
            <p className="mt-2 max-w-xl text-white/85">
              Reading, phonics, spelling and handwriting practice for Kindergarten, Primary 1 to 6 and JHS 1 to 3, with read-aloud, tracing and
              stars. Install it on your phone; it works offline.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <a href={LITERACY_URL} className="inline-flex items-center justify-center rounded-full bg-[#e3a82a] px-6 py-3 font-semibold text-[#14110c]">
              Open the app →
            </a>
            <Link href="/literacy" className="text-center text-sm text-white/80 underline">
              Learn more
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
