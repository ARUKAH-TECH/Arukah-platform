import type { BranchId } from "@/config/branches";

/** Pages that can show an "Our work" gallery. Ministry is left out on purpose:
 *  photos of people there go through the outreach consent checklist instead. */
export const GALLERY_BRANCHES: { id: BranchId; label: string; path: string }[] = [
  { id: "wear", label: "ARUKAH WEAR (footwear)", path: "/footwear" },
  { id: "tech", label: "ARUKAH TECH", path: "/tech" },
  { id: "ziva", label: "ZIVA Special Classes", path: "/ziva" },
  { id: "media", label: "ARUKAH MEDIA", path: "/media" },
  { id: "books", label: "ZIVARUKAH BOOKS", path: "/books" },
  { id: "home", label: "Homepage", path: "/" },
];
