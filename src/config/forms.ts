// The website does not collect visitors' personal details while this is
// false: every form (contact, ministry, adverts, book orders, gifts) is
// replaced by WhatsApp / call buttons, and the server refuses form posts.
// The form code is kept so it can be switched back on later — e.g. after
// registering with the Data Protection Commission — by setting this to true
// (and re-granting the database permissions; see the migration
// 20261023200000_forms_off.sql).
export const ONLINE_FORMS_ENABLED = false;

// Contact is by WhatsApp username only — the founder's personal phone number
// is deliberately not published anywhere on the site (Oct 2026).
export const WHATSAPP_USERNAME = "ShepherdJusticeSarpongOduro";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_USERNAME}`;
/** How the contact is written on pages, PDFs and photo stamps. */
export const CONTACT_DISPLAY = `WhatsApp @${WHATSAPP_USERNAME}`;
export const FORMS_OFF_MESSAGE = `Online forms are closed. Please message us on ${CONTACT_DISPLAY}.`;

export function whatsappLink(text: string) {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}
