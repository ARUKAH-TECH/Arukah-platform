// Divisions an item (project, banner, …) can be shown on. Must match
// public.valid_branches() in supabase/migrations.
export const BRANCHES = [
  { id: "home", label: "Homepage", path: "/" },
  { id: "tech", label: "ARUKAH TECH", path: "/tech" },
  { id: "wear", label: "ARUKAH WEAR", path: "/footwear" },
  { id: "ziva", label: "ZIVA Special Classes", path: "/ziva" },
  { id: "media", label: "ARUKAH MEDIA", path: "/media" },
  { id: "books", label: "ZIVARUKAH BOOKS", path: "/books" },
  { id: "ministry", label: "Repent Online Ministries", path: "/ministry" },
] as const;

export type BranchId = (typeof BRANCHES)[number]["id"];

export const BRANCH_IDS: readonly string[] = BRANCHES.map((branch) => branch.id);

export function branchLabel(id: string) {
  return BRANCHES.find((branch) => branch.id === id)?.label ?? id;
}
