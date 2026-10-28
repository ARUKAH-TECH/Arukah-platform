import { createServiceClient } from "@/lib/supabase/service";
import { protectPdf } from "@/server/pdfProtect";
import { paidBookFile } from "@/server/quickPayments";

// Hands a paying buyer their book as a read-only PDF stamped "ZIVA SERIES"
// with their payment reference and our contact. It opens and reads normally
// (and can be saved to a phone or computer to read later), but printing,
// copying text and editing are switched off.
// The payment is checked again on every request; the original file in the
// private bucket is never linked to directly.

export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const file = await paidBookFile(reference);
  if (!file) {
    return new Response("This book link has expired or is not valid. Please contact us on WhatsApp with your payment reference.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { data, error } = await createServiceClient().storage.from("book-files").download(file.path);
  if (error || !data) {
    console.error("[book-file] download failed", error?.message);
    return new Response("We couldn't open the book just now. Please try again in a minute.", { status: 502 });
  }

  const protectedBytes = await protectPdf(new Uint8Array(await data.arrayBuffer()), reference);
  if (!protectedBytes) {
    // Never fall back to the unprotected original.
    return new Response("We couldn't prepare your book just now. Please contact us on WhatsApp with your payment reference.", {
      status: 500,
    });
  }

  const asciiName = file.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(new Blob([protectedBytes as BlobPart], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${file.download ? "attachment" : "inline"}; filename="${asciiName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
