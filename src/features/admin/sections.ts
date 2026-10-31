// Every Admin section in one place: the header menu and the dashboard's
// "All sections" box are both built from this list, so they always match.

export type AdminSection = { title: string; description: string; href: string };
export type AdminGroup = { id: string; icon: string; title: string; sections: AdminSection[]; upcoming?: string[] };

export const ADMIN_GROUPS: AdminGroup[] = [
  {
    id: "visitors",
    icon: "📊",
    title: "Visitors",
    sections: [{ title: "Visitors", description: "Most viewed pages, where visitors come from, and the busiest day.", href: "/admin/visitors" }],
  },
  {
    id: "messages",
    icon: "📥",
    title: "Messages & orders",
    sections: [
      { title: "Inbox", description: "Messages from the Contact page and the Ministry response form.", href: "/admin/inbox" },
      { title: "Literacy comments", description: "Comments and suggestions from learn.zivarukah.com, to approve and reply to.", href: "/admin/literacy-comments" },
      { title: "Nursing class", description: "Free Saturday Zoom class: number of students, most needed subjects, courses and schools.", href: "/admin/nursing-class" },
      { title: "Book orders", description: "Orders from the books basket: payment, printing and delivery.", href: "/admin/book-orders" },
      { title: "Payments", description: "Gifts and payments received through Paystack.", href: "/admin/payments" },
      { title: "Adverts", description: "Approve or reject advert requests, set their dates, and record payment.", href: "/admin/adverts" },
    ],
  },
  {
    id: "content",
    icon: "📝",
    title: "Website content",
    sections: [
      { title: "Articles", description: "Write, preview, publish and unpublish articles and blog posts.", href: "/admin/articles" },
      { title: "Projects", description: "Create, schedule, publish and archive projects, and choose where they appear.", href: "/admin/projects" },
      { title: "Media library", description: "Upload photos and add YouTube or TikTok links, then attach them to projects.", href: "/admin/media" },
      { title: "Gallery", description: "Photos of your work, shown in an “Our work” section on a chosen page.", href: "/admin/gallery" },
      { title: "Announcements", description: "Banners at the top of chosen pages, with optional start and end times.", href: "/admin/announcements" },
      { title: "Page text", description: "Change the headings and wording on the website's pages.", href: "/admin/pages" },
    ],
  },
  {
    id: "ministry",
    icon: "🙏",
    title: "Ministry & books",
    sections: [
      { title: "Ministry outreach", description: "Hospital, prison, street, community and crusade outreach reports.", href: "/admin/outreach" },
      { title: "Books", description: "Add books with covers, prices per format and a free sample.", href: "/admin/books" },
    ],
  },
];
