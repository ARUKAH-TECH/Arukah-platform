export const WHATSAPP_LINK = "https://wa.me/233597573842";

interface FaqRule {
  keywords: string[];
  answer: string;
}

// Checked in order — put more specific rules first. This is a fixed,
// hand-written rule set, not a generative model: it can only ever return
// one of these exact answers (or the fallback), so it can never leak
// anything or go off-script.
const declineTechStack: FaqRule = {
  keywords: [
    "tech stack",
    "what software",
    "what technology",
    "what technologies",
    "what framework",
    "built with",
    "coded in",
    "programming language",
    "which language",
    "next.js",
    "nextjs",
    "react",
    "database do you use",
    "how is this site built",
    "how was this site built",
  ],
  answer:
    "That's something we keep to ourselves — happy to help with anything else about our services though!",
};

const rules: FaqRule[] = [
  declineTechStack,
  {
    keywords: ["website", "web development", "software", "app develop", "custom system", "management system"],
    answer:
      "Yes — ARUKAH TECH builds websites, custom software, and management systems. Check out /tech or use the contact form to discuss your project.",
  },
  {
    keywords: ["shoe", "shoes", "footwear", "slipper", "sandal", "wear", "retail", "wholesale"],
    answer:
      "Yes — ARUKAH WEAR sells Ghana-made footwear at retail, and we take wholesale orders too. See /footwear for details.",
  },
  {
    keywords: ["ziva", "special classes", "tuition", "school", "learn", "study", "class for my child"],
    answer:
      "Yes — ZIVA Special Classes covers Primary 1 to SHS 3. Visit /ziva to learn more, or use the contact form to enquire.",
  },
  {
    keywords: ["video", "media", "photography", "event coverage", "editing"],
    answer:
      "Yes — ARUKAH MEDIA offers video production, event coverage, and video editing. See /media for details.",
  },
  {
    keywords: ["ministry", "church", "sermon", "prayer", "convert", "faith", "bible"],
    answer:
      "You're welcome to visit /ministry — Repent Online Ministries has a dedicated form there for prayer requests and follow-up.",
  },
  {
    keywords: ["contact", "whatsapp", "phone number", "reach you", "reach out", "get in touch", "call you"],
    answer: `You can reach us on WhatsApp: ${WHATSAPP_LINK} — or use our contact form at /contact.`,
  },
];

const FALLBACK_ANSWER =
  "I don't have an answer for that one — please use our contact form and a real person will get back to you.";

export function matchFaq(question: string): string {
  const q = question.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => q.includes(keyword))) {
      return rule.answer;
    }
  }
  return FALLBACK_ANSWER;
}
