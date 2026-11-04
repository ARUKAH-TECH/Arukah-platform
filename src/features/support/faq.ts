import { WHATSAPP_URL } from "@/config/forms";

export const WHATSAPP_LINK = WHATSAPP_URL;

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
    "That's something we keep to ourselves. Happy to help with anything else about our services though!",
};

const rules: FaqRule[] = [
  declineTechStack,
  {
    keywords: ["website", "web development", "software", "app develop", "custom system", "management system"],
    answer:
      "Yes: ARUKAH TECH builds websites, custom software, and management systems. See /tech, or message us on WhatsApp to discuss your project.",
  },
  {
    keywords: ["shoe", "shoes", "footwear", "slipper", "sandal", "wear", "retail", "wholesale"],
    answer:
      "Yes: ARUKAH WEAR sells Ghana-made footwear at retail, and we take wholesale orders too. See /footwear for details.",
  },
  {
    keywords: ["ziva", "special classes", "tuition", "school", "learn", "study", "class for my child"],
    answer:
      "Yes: ZIVA Special Classes covers Primary 1 to SHS 3, at home or online. Visit /ziva and tap Apply now on WhatsApp.",
  },
  {
    keywords: ["book", "bookstore", "ebook", "e-book", "read online", "audiobook"],
    answer:
      "ZIVARUKAH BOOKS is open: read online, download or order a printed copy at /books.",
  },
  {
    keywords: ["ministry", "church", "sermon", "prayer", "convert", "faith", "bible"],
    answer:
      "You're welcome to visit /ministry: Repent Online Ministries is there for prayer, counselling and follow-up on WhatsApp.",
  },
  {
    keywords: ["contact", "whatsapp", "phone number", "reach you", "reach out", "get in touch", "call you"],
    answer: `You can reach us on WhatsApp: ${WHATSAPP_LINK}, or see /contact.`,
  },
];

const FALLBACK_ANSWER =
  "I don't have an answer for that one. Please message us on WhatsApp (see /contact) and a real person will get back to you.";

export function matchFaq(question: string): string {
  const q = question.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => q.includes(keyword))) {
      return rule.answer;
    }
  }
  return FALLBACK_ANSWER;
}
