import "server-only";
import { createHash, randomBytes } from "node:crypto";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFRawStream,
  PDFRef,
  PDFStream,
  PDFString,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import { PHONE_DISPLAY } from "@/config/forms";

// Makes a stamped, "read-only" copy of a book PDF for a buyer: it opens normally with
// no password, but PDF readers are told not to allow printing, copying text,
// editing or adding comments. (Standard PDF security, 128-bit, revision 3.)
//
// Honest limit: this is the protection PDF readers respect (Chrome, Adobe,
// phone viewers). Someone determined with special tools can still remove it —
// no downloadable file can be made 100% copy-proof.

const PAD = Buffer.from(
  "28bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9fe6453697a",
  "hex",
);

// Permission bits (PDF 1.7, table 22). Allowed: reading, accessibility (screen
// readers) and filling forms. Blocked: print (3, 12), modify (4), copy (5),
// annotate (6), assemble (11).
const PERMISSIONS =
  (0xfffff000 | (1 << 6) | (1 << 7) | (1 << 8) | (1 << 9)) | 0; // signed 32-bit

function md5(...parts: Uint8Array[]) {
  const h = createHash("md5");
  for (const p of parts) h.update(p);
  return h.digest();
}

/** RC4 (implemented here because modern OpenSSL builds no longer ship it). */
function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  for (let i = 0, j = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) & 255;
    [s[i], s[j]] = [s[j], s[i]];
  }
  const out = new Uint8Array(data.length);
  for (let k = 0, i = 0, j = 0; k < data.length; k++) {
    i = (i + 1) & 255;
    j = (j + s[i]) & 255;
    [s[i], s[j]] = [s[j], s[i]];
    out[k] = data[k] ^ s[(s[i] + s[j]) & 255];
  }
  return out;
}

function padPassword(password: Uint8Array) {
  return Buffer.concat([Buffer.from(password.slice(0, 32)), PAD]).subarray(0, 32);
}

function int32le(n: number) {
  const b = Buffer.alloc(4);
  b.writeInt32LE(n);
  return b;
}

/** Algorithm 3: the /O entry. */
function ownerEntry(ownerPassword: Uint8Array, userPassword: Uint8Array) {
  let h = md5(padPassword(ownerPassword));
  for (let i = 0; i < 50; i++) h = md5(h);
  const key = h.subarray(0, 16);
  let x = rc4(key, padPassword(userPassword));
  for (let i = 1; i <= 19; i++) x = rc4(key.map((b) => b ^ i), x);
  return Buffer.from(x);
}

/** Algorithm 2: the file key. */
function fileKey(userPassword: Uint8Array, o: Uint8Array, id0: Uint8Array) {
  let h = md5(padPassword(userPassword), o, int32le(PERMISSIONS), id0);
  for (let i = 0; i < 50; i++) h = md5(h.subarray(0, 16));
  return h.subarray(0, 16);
}

/** Algorithm 5: the /U entry. */
function userEntry(key: Uint8Array, id0: Uint8Array) {
  let x = rc4(key, md5(PAD, id0));
  for (let i = 1; i <= 19; i++) x = rc4(key.map((b) => b ^ i), x);
  return Buffer.concat([Buffer.from(x), Buffer.alloc(16)]);
}

function objectKey(key: Uint8Array, ref: PDFRef) {
  const n = ref.objectNumber;
  const g = ref.generationNumber;
  return md5(key, Uint8Array.of(n & 255, (n >> 8) & 255, (n >> 16) & 255, g & 255, (g >> 8) & 255)).subarray(0, 16);
}

const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");

/** Encrypts every string inside `obj`; returns the (possibly new) object. */
function encryptStrings(obj: PDFObject, key: Uint8Array): PDFObject {
  if (obj instanceof PDFString || obj instanceof PDFHexString) {
    return PDFHexString.of(toHex(rc4(key, obj.asBytes())));
  }
  if (obj instanceof PDFDict) {
    for (const [name, value] of obj.entries()) obj.set(name, encryptStrings(value, key));
    return obj;
  }
  if (obj instanceof PDFArray) {
    for (let i = 0; i < obj.size(); i++) obj.set(i, encryptStrings(obj.get(i), key));
    return obj;
  }
  return obj;
}

const BRAND = "ZIVA SERIES";

/** Stamps every page: a faint diagonal "ZIVA SERIES" and a footer with the buyer's reference and our contact. */
async function addWatermark(doc: PDFDocument, reference: string) {
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const footer = `${BRAND}  ·  Licensed copy  ·  Ref ${reference}  ·  WhatsApp/Call ${PHONE_DISPLAY}  ·  zivarukah.com`;
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const { x: left, y: bottom } = page.getMediaBox();

    // Diagonal brand mark, sized to the page.
    const diagonal = Math.hypot(width, height);
    const size = Math.min(diagonal * 0.09, (diagonal * 0.7) / (bold.widthOfTextAtSize(BRAND, 1) || 1));
    const textWidth = bold.widthOfTextAtSize(BRAND, size);
    const angle = Math.atan2(height, width);
    const cx = left + width / 2;
    const cy = bottom + height / 2;
    page.drawText(BRAND, {
      x: cx - (Math.cos(angle) * textWidth) / 2 + (Math.sin(angle) * size * 0.35),
      y: cy - (Math.sin(angle) * textWidth) / 2 - (Math.cos(angle) * size * 0.35),
      size,
      font: bold,
      color: rgb(0.043, 0.412, 0.659), // ZIVA blue
      opacity: 0.08,
      rotate: degrees((angle * 180) / Math.PI),
    });

    // Footer line, shrunk to fit narrow pages.
    let footSize = Math.max(5, Math.min(8, height * 0.011));
    while (footSize > 4 && regular.widthOfTextAtSize(footer, footSize) > width * 0.92) footSize -= 0.25;
    const footWidth = regular.widthOfTextAtSize(footer, footSize);
    page.drawText(footer, {
      x: left + (width - footWidth) / 2,
      y: bottom + Math.max(8, height * 0.015),
      size: footSize,
      font: regular,
      color: rgb(0.35, 0.35, 0.35),
      opacity: 0.85,
    });
  }
  await doc.flush(); // write fonts/stamps into the file before it is encrypted
}

/**
 * Returns protected PDF bytes, or null if the file can't be processed (for
 * example it is already password-protected) — the caller decides what to do.
 */
export async function protectPdf(source: Uint8Array, reference: string): Promise<Uint8Array | null> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(source, { updateMetadata: false });
  } catch (error) {
    console.error("[pdf-protect] could not open PDF", error instanceof Error ? error.message : error);
    return null;
  }
  try {
    await addWatermark(doc, reference);
    const context = doc.context;

    const id0 = randomBytes(16);
    const userPassword = new Uint8Array(0); // opens without a password
    const ownerPassword = randomBytes(32); // never stored: nobody can lift the limits with a password
    const o = ownerEntry(ownerPassword, userPassword);
    const key = fileKey(userPassword, o, id0);
    const u = userEntry(key, id0);

    for (const [ref, obj] of context.enumerateIndirectObjects()) {
      if (obj instanceof PDFStream) {
        const type = obj.dict.get(PDFName.of("Type"));
        if (type === PDFName.of("XRef") || type === PDFName.of("ObjStm")) {
          context.delete(ref); // rebuilt on save
          continue;
        }
        const k = objectKey(key, ref);
        encryptStrings(obj.dict, k);
        context.assign(ref, PDFRawStream.of(obj.dict, rc4(k, obj.getContents())));
      } else {
        context.assign(ref, encryptStrings(obj, objectKey(key, ref)));
      }
    }

    // Added after the loop: the security dictionary itself is never encrypted.
    const encrypt = context.obj({
      Filter: "Standard",
      V: 2,
      R: 3,
      Length: 128,
      P: PDFNumber.of(PERMISSIONS),
      O: PDFHexString.of(toHex(o)),
      U: PDFHexString.of(toHex(u)),
    });
    context.trailerInfo.Encrypt = context.register(encrypt);
    context.trailerInfo.ID = context.obj([PDFHexString.of(toHex(id0)), PDFHexString.of(toHex(id0))]);

    return await doc.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
  } catch (error) {
    console.error("[pdf-protect] could not protect PDF", error instanceof Error ? error.message : error);
    return null;
  }
}
