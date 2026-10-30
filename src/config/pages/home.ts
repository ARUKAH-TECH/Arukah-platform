import type { PageDef } from "./types";

// Defaults are the homepage's original wording, copied verbatim.
export const homePage: PageDef = {
  id: "home",
  label: "Homepage",
  path: "/",
  groups: [
    {
      title: "Top of the page",
      fields: [
        { key: "heroTagline", label: "Tagline", kind: "text", max: 160, default: "Creating Solutions. Building Skills. Serving Communities." },
        { key: "heroSupportingLine", label: "Line under the tagline", kind: "text", max: 120, default: "Technology • Education • Manufacturing • Media • Books" },
      ],
    },
    {
      title: "About",
      fields: [
        { key: "aboutTitle", label: "Heading", kind: "text", max: 100, default: "One brand, several ways to serve" },
        {
          key: "aboutText",
          label: "Text",
          kind: "textarea",
          max: 600,
          default:
            "ZIVARUKAH brings together technology, education, manufacturing, media, books and ministry under one identity, each division run with its own craft, but the same purpose: creating solutions, building skills, and serving communities.",
        },
      ],
    },
    {
      title: "Our businesses",
      fields: [
        { key: "businessesTitle", label: "Heading", kind: "text", max: 100, default: "What ZIVARUKAH builds" },
        { key: "techCard", label: "ARUKAH TECH card", kind: "text", max: 120, default: "Software, websites, and management systems." },
        { key: "wearCard", label: "ARUKAH WEAR card", kind: "text", max: 120, default: "Ghana-made, handcrafted footwear." },
        { key: "zivaCard", label: "ZIVA Special Classes card", kind: "text", max: 120, default: "Admissions open: special teaching, Primary 1 to JHS, at home or online." },
        { key: "mediaCard", label: "ARUKAH MEDIA card", kind: "text", max: 120, default: "Video production and creative media." },
        { key: "booksCard", label: "ZIVARUKAH BOOKS card", kind: "text", max: 120, default: "Books to read online, download, or order in print. Coming soon." },
      ],
    },
    {
      title: "ARUKAH TECH section",
      fields: [
        { key: "techTitle", label: "Heading", kind: "text", max: 100, default: "Innovate. Develop. Empower." },
        {
          key: "techText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default:
            "Custom software and management systems built for schools, churches, fuel stations, and other organizations that need reliable, well-maintained technology.",
        },
        {
          key: "techServices",
          label: "Services (one per line)",
          kind: "list",
          max: 100,
          maxItems: 8,
          default: [
            "Website & software development",
            "School, church & fuel station management systems",
            "Cloud & deployment support",
            "Ongoing maintenance & technical support",
          ],
        },
      ],
    },
    {
      title: "Featured projects section",
      fields: [
        { key: "projectsTitle", label: "Heading", kind: "text", max: 100, default: "Completed work by ARUKAH TECH" },
        {
          key: "projectsText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default:
            "A website and a church management system, both built for Bethel Inspiration Foundation. We build websites and management systems for churches, schools and businesses.",
        },
      ],
    },
    {
      title: "ARUKAH WEAR section",
      fields: [
        { key: "wearTitle", label: "Heading", kind: "text", max: 100, default: "Home of classic and quality wears" },
        {
          key: "wearText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default: "Ghana-made footwear, crafted with attention to material and durability, from everyday slippers to custom pairs.",
        },
        {
          key: "wearHighlights",
          label: "Highlights (one per line)",
          kind: "list",
          max: 100,
          maxItems: 8,
          default: ["Slippers & sandals", "Men's, women's & children's footwear", "Custom & wholesale orders"],
        },
        { key: "wearNote", label: "Small note", kind: "text", max: 200, default: "Product photos and pricing are added once real inventory is ready." },
      ],
    },
    {
      title: "ZIVA section",
      fields: [
        { key: "zivaTitle", label: "Heading", kind: "text", max: 100, default: "Excellence our hallmark" },
        {
          key: "zivaText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default: "Special classes for students from Primary 1 to SHS 3, focused on genuine academic growth.",
        },
      ],
    },
    {
      title: "ARUKAH MEDIA section",
      fields: [
        { key: "mediaTitle", label: "Heading", kind: "text", max: 100, default: "Creative media, done well" },
        {
          key: "mediaServices",
          label: "Services (one per line)",
          kind: "list",
          max: 60,
          maxItems: 8,
          default: ["Video production", "Event coverage", "Video editing", "Promotional videos"],
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
          default:
            "Kept visually and editorially separate from the commercial ZIVARUKAH businesses. Follow along as content is published across:",
        },
      ],
    },
    {
      title: "Why ZIVARUKAH",
      fields: [
        { key: "whyTitle", label: "Heading", kind: "text", max: 100, default: "What holds it together" },
        { key: "why1Title", label: "Point 1: title", kind: "text", max: 80, default: "Solutions built for real needs" },
        { key: "why1Text", label: "Point 1: text", kind: "textarea", max: 250, default: "Technology and systems designed around how organizations actually work." },
        { key: "why2Title", label: "Point 2: title", kind: "text", max: 80, default: "Skills that last" },
        { key: "why2Text", label: "Point 2: text", kind: "textarea", max: 250, default: "Education and training focused on genuine, lasting excellence." },
        { key: "why3Title", label: "Point 3: title", kind: "text", max: 80, default: "Craftsmanship you can trust" },
        { key: "why3Text", label: "Point 3: text", kind: "textarea", max: 250, default: "Footwear made with attention to material and quality, not shortcuts." },
        { key: "why4Title", label: "Point 4: title", kind: "text", max: 80, default: "Communities, not just customers" },
        { key: "why4Text", label: "Point 4: text", kind: "textarea", max: 250, default: "Every division exists to serve people first, commercially and in ministry." },
      ],
    },
    {
      title: "Get in touch",
      fields: [
        { key: "contactTitle", label: "Heading", kind: "text", max: 100, default: "Let's talk about your project" },
        { key: "contactText", label: "Text", kind: "textarea", max: 300, default: "Tell us a bit about what you need and we'll get back to you." },
      ],
    },
  ],
};
