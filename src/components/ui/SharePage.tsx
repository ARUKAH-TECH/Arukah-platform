import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ui/ShareButtons";

const SITE = process.env.SITE_URL || "https://zivarukah.com";

/** A "Share this page" strip: WhatsApp, the phone's share sheet and Copy link. */
export function SharePage({
  path,
  title,
  message,
  heading = "📣 Share this page",
  note,
  dark = false,
}: {
  path: string;
  title: string;
  message: string;
  heading?: string;
  note?: string;
  dark?: boolean;
}) {
  return (
    <section aria-label="Share this page" className="py-10">
      <Container>
        <div
          className={`flex flex-col gap-3 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between ${
            dark ? "border-white/15 bg-white/5 text-white" : "border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5"
          }`}
        >
          <div>
            <p className="text-lg font-bold">{heading}</p>
            {note && <p className={`mt-1 text-sm ${dark ? "text-white/70" : "text-foreground/70"}`}>{note}</p>}
          </div>
          <ShareButtons url={`${SITE}${path}`} title={title} message={message} label="Send" dark={dark} />
        </div>
      </Container>
    </section>
  );
}
