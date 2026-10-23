import { PHONE_DISPLAY, WHATSAPP_NUMBER, whatsappLink } from "@/config/forms";

/** Used instead of a form: opens WhatsApp with a ready message, or calls. */
export function WhatsAppContact({
  message,
  label = "Message us on WhatsApp",
  dark = false,
  note,
}: {
  message: string;
  label?: string;
  dark?: boolean;
  note?: string;
}) {
  const muted = dark ? "text-white/60" : "text-foreground/60";
  return (
    <div className={`rounded-2xl border p-6 ${dark ? "border-white/15" : "border-black/10 dark:border-white/10"}`}>
      <div className="flex flex-wrap gap-3">
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
        >
          {label}
        </a>
        <a
          href={`tel:+${WHATSAPP_NUMBER}`}
          className={`inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-sm font-medium ${
            dark ? "border-white/25" : "border-black/15 dark:border-white/15"
          }`}
        >
          Call {PHONE_DISPLAY}
        </a>
      </div>
      {note && <p className={`mt-4 text-sm leading-6 ${muted}`}>{note}</p>}
    </div>
  );
}
