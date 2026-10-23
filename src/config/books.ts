// Book formats offered by ZIVARUKAH BOOKS. Each maps to a price column on
// public.books; a missing price means that format isn't offered.
export const BOOK_FORMATS = [
  { id: "read", label: "Read online", column: "price_read_ghs" },
  { id: "download", label: "Digital download", column: "price_download_ghs" },
  { id: "print", label: "Printed copy", column: "price_print_ghs" },
] as const;

export type BookFormat = (typeof BOOK_FORMATS)[number]["id"];

/** "GHS 45.00" */
export function formatGhs(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
