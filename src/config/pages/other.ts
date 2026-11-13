import type { PageDef } from "./types";

// Defaults are each page's original wording, copied verbatim.

export const mediaPage: PageDef = {
  id: "media",
  label: "ARUKAH MEDIA",
  path: "/media",
  groups: [
    {
      title: "Top of the page",
      fields: [
        {
          key: "heroTagline",
          label: "Tagline",
          kind: "textarea",
          max: 300,
          default:
            "Creative media, done well. No dedicated logo has been supplied yet, so ARUKAH MEDIA uses the master ZIVARUKAH logo for now.",
        },
      ],
    },
    {
      title: "Services",
      fields: [
        { key: "servicesTitle", label: "Heading", kind: "text", max: 100, default: "Services" },
        {
          key: "services",
          label: "Services (one per line)",
          kind: "list",
          max: 60,
          maxItems: 12,
          default: ["Video production", "Event coverage", "Video editing", "Promotional videos"],
        },
      ],
    },
  ],
};

export const booksPage: PageDef = {
  id: "books",
  label: "ZIVARUKAH BOOKS",
  path: "/books",
  groups: [
    {
      title: "Top of the page",
      fields: [
        {
          key: "heroTagline",
          label: "Tagline",
          kind: "textarea",
          max: 300,
          default:
            "An online bookstore is on the way. No books are on sale yet, get in touch if you'd like to hear when it opens.",
        },
      ],
    },
    {
      title: "Book list",
      fields: [{ key: "booksTitle", label: "Heading (shown once a book is published)", kind: "text", max: 100, default: "Books available now" }],
    },
    {
      title: "After an order is placed",
      fields: [
        {
          key: "afterOrder",
          label: "Message shown with the order number (add your MoMo / payment details here)",
          kind: "textarea",
          max: 600,
          default:
            "We'll call or WhatsApp you shortly to confirm your order and arrange payment. Please quote your order number when you pay.",
        },
      ],
    },
  ],
};

export const ministryPage: PageDef = {
  id: "ministry",
  label: "Repent Online Ministries",
  path: "/ministry",
  groups: [
    {
      title: "Top of the page",
      fields: [
        { key: "motto", label: "Motto", kind: "text", max: 80, default: "Rescue the Perishing" },
        {
          key: "intro",
          label: "Introduction",
          kind: "textarea",
          max: 400,
          default:
            "The ministry arm of ZIVARUKAH: preaching, teaching, prayer and outreach. Follow the message on:",
        },
      ],
    },
    {
      title: "Response form section",
      fields: [
        { key: "respondEyebrow", label: "Small heading", kind: "text", max: 80, default: "New here, or growing in faith?" },
        { key: "respondTitle", label: "Heading", kind: "text", max: 100, default: "Let the ministry know" },
        {
          key: "respondText",
          label: "Text",
          kind: "textarea",
          max: 500,
          default:
            "Whether you just gave your life to Christ, are rededicating, or simply want to grow deeper, tell us a little about where you are so someone from the ministry can follow up and walk with you.",
        },
      ],
    },
  ],
};

export const projectsPage: PageDef = {
  id: "projects",
  label: "Projects page",
  path: "/projects",
  groups: [
    {
      title: "Published projects list",
      fields: [{ key: "latestTitle", label: "Heading (shown once a project is published)", kind: "text", max: 100, default: "Our latest projects" }],
    },
    {
      title: "Systems we build",
      fields: [
        { key: "systemsTitle", label: "Heading", kind: "text", max: 100, default: "Systems ARUKAH TECH builds" },
        {
          key: "systemsText",
          label: "Text",
          kind: "textarea",
          max: 500,
          default:
            "Websites and management systems for churches, schools and businesses. Our church management system is complete and in use; school, hospital and fuel station systems are being built.",
        },
        { key: "card1Name", label: "Card 1: name", kind: "text", max: 80, default: "School Management System" },
        { key: "card1Text", label: "Card 1: text", kind: "textarea", max: 250, default: "Enrollment, attendance, grading, and communication tools for schools." },
        { key: "card2Name", label: "Card 2: name", kind: "text", max: 80, default: "Church Management System" },
        { key: "card2Text", label: "Card 2: text", kind: "textarea", max: 250, default: "Membership records, giving, and event coordination for churches." },
      ],
    },
  ],
};

export const contactPage: PageDef = {
  id: "contact",
  label: "Contact page",
  path: "/contact",
  groups: [
    {
      title: "Contact form section",
      fields: [
        { key: "title", label: "Heading", kind: "text", max: 100, default: "Let's talk about your project" },
        { key: "text", label: "Text", kind: "textarea", max: 300, default: "Tell us a bit about what you need and we'll get back to you." },
      ],
    },
    {
      title: "Ministry form section",
      fields: [
        { key: "ministryTitle", label: "Heading", kind: "text", max: 100, default: "New here, or growing in faith?" },
        {
          key: "ministryText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default:
            "For new and returning believers, or anyone wanting prayer or spiritual follow-up. Message the ministry on WhatsApp.",
        },
      ],
    },
  ],
};

export const advertisePage: PageDef = {
  id: "advertise",
  label: "Advertise With Us page",
  path: "/advertise",
  groups: [
    {
      title: "Introduction",
      fields: [
        { key: "title", label: "Heading", kind: "text", max: 100, default: "Advertise With Us" },
        {
          key: "intro",
          label: "Text",
          kind: "textarea",
          max: 600,
          default:
            "Reach people who visit ZIVARUKAH's technology, education, footwear, books and ministry pages. Tell us what your advert is about. We review every request before anything goes live.",
        },
      ],
    },
    {
      title: "How it works",
      fields: [
        {
          key: "steps",
          label: "Steps (one per line)",
          kind: "list",
          max: 160,
          maxItems: 6,
          default: [
            "Message us on WhatsApp: what the advert is about, your location, and a photo if you have one.",
            "We reply to agree the dates and the price.",
            "Your advert goes live once it's approved.",
          ],
        },
        {
          key: "note",
          label: "Small note",
          kind: "textarea",
          max: 300,
          default: "Adverts never appear on the Repent Online Ministries pages.",
        },
      ],
    },
  ],
};

export const socialPage: PageDef = {
  id: "social",
  label: "Social media links",
  path: "/",
  groups: [
    {
      title: "Your accounts (shown as buttons in the footer of every page, the homepage, Ministry and About)",
      fields: [
        {
          key: "links",
          label: "One full link per line, e.g. https://www.tiktok.com/@name. To add a new account later, just add a new line.",
          kind: "list",
          max: 300,
          maxItems: 15,
          default: [
            "https://www.facebook.com/sarpong.justice.7792",
            "https://www.youtube.com/@REPENTTV24",
            "https://www.tiktok.com/@shepherdjusticesarpong",
            "https://wa.me/ShepherdJusticeSarpongOduro",
          ],
        },
      ],
    },
  ],
};
