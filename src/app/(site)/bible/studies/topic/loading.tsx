import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <Container>
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-5xl">📚</p>
        <p className="mt-4 text-xl font-bold">Preparing your Bible study…</p>
        <p className="mt-1 text-foreground/60">
          Checking the Scriptures, a Bible dictionary and other Christian sources. A new topic can take one to two minutes the first time; after that it opens at once.
        </p>
      </div>
    </Container>
  );
}
