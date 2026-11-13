import type { PageDef } from "./types";

// The homepage's wording (editable in Admin → Page text). Simplified Nov 2026:
// hero, upcoming programmes, businesses, featured work, about, ministry, contact.
export const homePage: PageDef = {
  id: "home",
  label: "Homepage",
  path: "/",
  groups: [
    {
      title: "Top of the page",
      fields: [
        { key: "heroTagline", label: "Tagline", kind: "text", max: 160, default: "Creating Solutions. Building Skills. Serving Communities." },
        { key: "heroSupportingLine", label: "Line under the tagline", kind: "text", max: 120, default: "Technology • Education • Footwear • Books • Ministry" },
      ],
    },
    {
      title: "Our businesses",
      fields: [
        { key: "businessesTitle", label: "Heading", kind: "text", max: 100, default: "What ZIVARUKAH does" },
        { key: "techCard", label: "ARUKAH TECH card", kind: "text", max: 120, default: "Websites, software and management systems for churches, schools and businesses." },
        { key: "wearCard", label: "ARUKAH WEAR card", kind: "text", max: 120, default: "Handcrafted, Ghana-made footwear: slippers, sandals, custom and wholesale orders." },
        { key: "zivaCard", label: "ZIVA Special Classes card", kind: "text", max: 120, default: "Admissions open: special teaching from Primary 1 to SHS 3, at home or online." },
        { key: "literacyCard", label: "ZIVA Learning app card", kind: "text", max: 120, default: "A free app for reading, phonics, spelling and handwriting, KG to JHS. Works offline." },
        { key: "booksCard", label: "ZIVARUKAH BOOKS card", kind: "text", max: 120, default: "Books by Shepherd Justice Sarpong Oduro: read online, download or order in print." },
      ],
    },
    {
      title: "Featured work",
      fields: [
        { key: "projectsTitle", label: "Heading", kind: "text", max: 100, default: "Completed work by ARUKAH TECH" },
        {
          key: "projectsText",
          label: "Text",
          kind: "textarea",
          max: 300,
          default: "A website and a church management system, both built for Bethel Inspiration Foundation. We build websites and management systems for churches, schools and businesses.",
        },
      ],
    },
    {
      title: "About",
      fields: [
        { key: "aboutTitle", label: "Heading", kind: "text", max: 100, default: "God's light brings total restoration" },
        {
          key: "aboutText",
          label: "Text",
          kind: "textarea",
          max: 600,
          default:
            "ZIVARUKAH brings technology, education, footwear, books and ministry together under one name, with one purpose: creating solutions, building skills and serving communities, spiritually and physically.",
        },
      ],
    },
    {
      title: "Ministry section",
      fields: [
        { key: "ministryMotto", label: "Motto", kind: "text", max: 80, default: "Rescue the Perishing" },
        {
          key: "ministryText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default: "The ministry arm of ZIVARUKAH: online preaching, teaching, prayer and outreach. Follow and share the message:",
        },
      ],
    },
    {
      title: "Get in touch",
      fields: [
        { key: "contactTitle", label: "Heading", kind: "text", max: 100, default: "Let's talk about what you need" },
        {
          key: "contactText",
          label: "Text",
          kind: "textarea",
          max: 300,
          default: "A website, a management system, footwear, classes for your child or a book: message us on WhatsApp and we'll reply.",
        },
      ],
    },
  ],
};
