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
            "Excellence our hallmark. Admissions are open for special teaching from Primary 1 to JHS, by home service or online.",
        },
      ],
    },
    {
      title: "Admissions",
      fields: [
        { key: "admissionsBadge", label: "Badge", kind: "text", max: 40, default: "Admissions open" },
        { key: "admissionsTitle", label: "Heading", kind: "text", max: 120, default: "Admissions are open: special teaching from Primary 1 to JHS" },
        {
          key: "admissionsText",
          label: "Text",
          kind: "textarea",
          max: 400,
          default:
            "ZIVA Online and Special Classes is now admitting learners from Primary 1 to JHS 3 who want extra, focused teaching. Choose one subject or several.",
        },
        {
          key: "subjects",
          label: "Subjects (one per line)",
          kind: "list",
          max: 60,
          maxItems: 12,
          default: ["Mathematics", "Science", "English Language", "Creative Arts", "Career Technology", "Religious and Moral Education (R.M.E)"],
        },
        { key: "homeTitle", label: "Home service: title", kind: "text", max: 60, default: "Home service" },
        {
          key: "homeText",
          label: "Home service: text",
          kind: "textarea",
          max: 250,
          default: "A ZIVA teacher comes to the learner's home, where your location allows.",
        },
        { key: "onlineTitle", label: "Online service: title", kind: "text", max: 60, default: "Online service" },
        {
          key: "onlineText",
          label: "Online service: text",
          kind: "textarea",
          max: 250,
          default: "Live lessons on a phone, tablet or computer, for learners anywhere.",
        },
        {
          key: "applyText",
          label: "How to apply",
          kind: "textarea",
          max: 300,
          default:
            "Tap Apply now and send us the learner's class, the subjects you want and your town. We'll tell you whether home or online service suits your location, and the next steps.",
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
