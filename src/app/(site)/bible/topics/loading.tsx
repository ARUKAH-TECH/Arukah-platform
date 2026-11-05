import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <Container>
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-5xl">📖</p>
        <p className="mt-4 text-xl font-bold">Searching the Scriptures…</p>
        <p className="mt-1 text-foreground/60">A new topic takes up to half a minute the first time.</p>
      </div>
    </Container>
  );
}
