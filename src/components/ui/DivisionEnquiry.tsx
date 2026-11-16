import { whatsappLink } from "@/config/forms";

// Service enquiry without a form: the visitor picks a division and WhatsApp
// opens with a ready message naming it. No personal details are stored by
// the website (online forms stay off until the data-protection work is done).
const DIVISIONS: { icon: string; name: string; about: string }[] = [
  { icon: "💻", name: "ARUKAH TECH", about: "a website, software or a management system" },
  { icon: "👟", name: "ARUKAH WEAR", about: "footwear, clothing or branded wear" },
  { icon: "🎓", name: "ZIVA Special Classes", about: "classes for my child" },
  { icon: "📱", name: "ZIVA Learning app", about: "the ZIVA Learning app" },
  { icon: "📚", name: "ZIVARUKAH BOOKS", about: "a book" },
  { icon: "🗓️", name: "Online programmes", about: "an online programme" },
  { icon: "✝️", name: "Repent Online Ministries", about: "the ministry" },
  { icon: "💬", name: "Something else", about: "" },
];

export function DivisionEnquiry() {
  return (
    <section id="enquiry" className="scroll-mt-24">
      <h2 className="text-center text-xl font-bold tracking-tight">Send an enquiry</h2>
      <p className="mt-1 text-center text-sm text-foreground/70">Choose what it is about. WhatsApp opens with your message started; add the details and send.</p>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DIVISIONS.map((d) => (
          <li key={d.name}>
            <a
              href={whatsappLink(d.about ? `Hello ZIVARUKAH (${d.name}), I would like to ask about ${d.about}: ` : "Hello ZIVARUKAH, I would like to ask about ")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 font-semibold shadow-sm hover:border-[#25D366] dark:border-white/10 dark:bg-white/5"
            >
              <span className="text-xl" aria-hidden="true">
                {d.icon}
              </span>
              <span className="min-w-0 flex-1">{d.name}</span>
              <span className="text-sm text-[#128C7E]" aria-hidden="true">
                WhatsApp →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
