import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PaidReturn } from "@/features/programmes/PaidReturn";

export const metadata: Metadata = { title: "Programme payment", robots: { index: false } };

// Paystack sends the visitor here with ?reference=ZP-… (also as ?trxref=).
export default async function ProgrammePaidPage({ searchParams }: PageProps<"/programmes/paid">) {
  const params = await searchParams;
  const raw = params.reference ?? params.trxref;
  const reference = typeof raw === "string" ? raw : "";
  return (
    <section className="py-14">
      <Container>
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">Programme payment</h1>
          <div className="mt-5">
            {/^ZP-[A-Z0-9]{10}$/.test(reference) ? <PaidReturn reference={reference} /> : <p className="text-foreground/70">This payment link is not complete.</p>}
          </div>
        </div>
      </Container>
    </section>
  );
}
