import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <Container>
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-5xl">📖</p>
        <p className="mt-4 text-xl font-bold">Searching the Scriptures…</p>
        <p className="mt-1 text-foreground/60">A new topic or question is studied in depth the first time: this can take up to a minute. After that it opens at once.</p>
      </div>
    </Container>
  );
}
