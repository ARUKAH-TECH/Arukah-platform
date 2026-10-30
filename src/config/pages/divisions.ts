import type { PageDef } from "./types";

// Defaults are each page's original wording, copied verbatim.

export const techPage: PageDef = {
  id: "tech",
  label: "ARUKAH TECH",
  path: "/tech",
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
            "Innovate. Develop. Empower. Custom software and management systems built for organizations that need reliable, well-maintained technology.",
        },
      ],
    },
    {
      title: "Services",
      fields: [
        { key: "servicesTitle", label: "Heading", kind: "text", max: 100, default: "Services" },
        { key: "group1Title", label: "Column 1: title", kind: "text", max: 60, default: "Management systems" },
        {
          key: "group1Items",
          label: "Column 1: items (one per line)",
          kind: "list",
          max: 100,
          maxItems: 10,
          default: [
            "School management systems",
            "Church management systems",
            "Fuel station management systems",
            "Hospital management systems",
            "Organization management systems",
          ],
        },
        { key: "group2Title", label: "Column 2: title", kind: "text", max: 60, default: "Software & web" },
        {
          key: "group2Items",
          label: "Column 2: items (one per line)",
          kind: "list",
          max: 100,
          maxItems: 10,
          default: ["Website development", "Custom software"],
        },
        { key: "group3Title", label: "Column 3: title", kind: "text", max: 60, default: "Deployment & support" },
        {
          key: "group3Items",
          label: "Column 3: items (one per line)",
          kind: "list",
          max: 100,
          maxItems: 10,
          default: ["System deployment", "System management", "Maintenance", "Technical support"],
        },
      ],
    },
    {
      title: "Our work section",
      fields: [
        { key: "projectsTitle", label: "Heading", kind: "text", max: 100, default: "Completed work: a website and a management system" },
        {
          key: "projectsText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default:
            "Our first completed projects, both for Bethel Inspiration Foundation: their public website and their church management system. School, hospital and fuel station systems are next.",
        },
      ],
    },
  ],
};

export const wearPage: PageDef = {
  id: "wear",
  label: "ARUKAH WEAR",
  path: "/footwear",
  groups: [
    {
      title: "Top of the page",
      fields: [
        {
          key: "heroTagline",
          label: "Tagline",
          kind: "textarea",
          max: 300,
          default: "Home of classic and quality wears. Ghana-made footwear, crafted with attention to material and durability.",
        },
      ],
    },
    {
      title: "Products",
      fields: [
        { key: "productsTitle", label: "Heading", kind: "text", max: 100, default: "Products" },
        {
          key: "products",
          label: "Products (one per line)",
          kind: "list",
          max: 60,
          maxItems: 12,
          default: [
            "Slippers",
            "Sandals",
            "Men's footwear",
            "Women's footwear",
            "Children's footwear",
            "Custom footwear",
            "Wholesale orders",
          ],
        },
        { key: "productsNote", label: "Small note", kind: "text", max: 200, default: "Product photos and pricing are added once real inventory is ready." },
      ],
    },
    {
      title: "Craftsmanship",
      fields: [
        { key: "craftTitle", label: "Heading", kind: "text", max: 100, default: "Handcrafted, premium, Ghana-made" },
        {
          key: "craftText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default:
            "Every pair is made with attention to material and quality, not shortcuts: durable footwear built to last, with style that holds up.",
        },
      ],
    },
  ],
};

export const zivaPage: PageDef = {
  id: "ziva",
  label: "ZIVA Special Classes",
  path: "/ziva",
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
            "Excellence our hallmark. Special classes for students from Primary 1 to SHS 3, focused on genuine academic growth.",
        },
      ],
    },
    {
      title: "Coming soon section",
      fields: [
        { key: "upcomingTitle", label: "Heading", kind: "text", max: 100, default: "A dedicated ZIVA platform is coming" },
        {
          key: "upcomingText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default:
            "A future phase of this platform will add online tools for enrollment, teachers, attendance, fees, and parent communication. For now, get in touch to enquire about classes.",
        },
        {
          key: "upcomingItems",
          label: "Features (one per line)",
          kind: "list",
          max: 60,
          maxItems: 12,
          default: [
            "Student enrollment",
            "Teacher management",
            "Attendance tracking",
            "Subjects & timetables",
            "Fees",
            "Performance reports",
            "Parent communication",
          ],
        },
      ],
    },
  ],
};
