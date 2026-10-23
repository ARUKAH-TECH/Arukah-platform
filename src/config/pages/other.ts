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
            "An online bookstore is on the way. No books are on sale yet — get in touch if you'd like to hear when it opens.",
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
    {
      title: "Coming soon section",
      fields: [
        { key: "upcomingTitle", label: "Heading", kind: "text", max: 100, default: "What the bookstore will offer" },
        {
          key: "upcomingText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default: "A future phase of this platform adds the bookstore itself. Until then, nothing here can be purchased.",
        },
        {
          key: "upcomingItems",
          label: "Features (one per line)",
          kind: "list",
          max: 60,
          maxItems: 12,
          default: ["Read online", "Digital downloads", "Printed copies", "Read-aloud support"],
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
            "Kept visually and editorially separate from the commercial ZIVARUKAH businesses. Follow along as content is published across:",
        },
      ],
    },
    {
      title: "Coming soon section",
      fields: [
        { key: "upcomingTitle", label: "Heading", kind: "text", max: 100, default: "What this ministry will share" },
        {
          key: "upcomingItems",
          label: "Items (one per line)",
          kind: "list",
          max: 60,
          maxItems: 12,
          default: ["Sermons", "Teachings", "Videos", "Prayer programs", "Announcements", "Events", "Testimonies"],
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
            "Whether you just gave your life to Christ, are rededicating, or simply want to grow deeper — tell us a little about where you are so someone from the ministry can follow up and walk with you.",
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
            "These are the kinds of management systems in active development. Screenshots and case studies are added here as projects are completed — none are presented as finished work for a named client until that's confirmed.",
        },
        { key: "card1Name", label: "Card 1 — name", kind: "text", max: 80, default: "School Management System" },
        { key: "card1Text", label: "Card 1 — text", kind: "textarea", max: 250, default: "Enrollment, attendance, grading, and communication tools for schools." },
        { key: "card2Name", label: "Card 2 — name", kind: "text", max: 80, default: "Church Management System" },
        { key: "card2Text", label: "Card 2 — text", kind: "textarea", max: 250, default: "Membership records, giving, and event coordination for churches." },
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
            "This is a separate form for the ministry side of ZIVARUKAH — for new and returning converts, or anyone wanting prayer or spiritual follow-up.",
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
            "Reach people who visit ZIVARUKAH's technology, education, footwear, media and books pages. Tell us what your advert is about — we review every request before anything goes live.",
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
