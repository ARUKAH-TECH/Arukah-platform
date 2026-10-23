// The website does not collect visitors' personal details while this is
// false: every form (contact, ministry, adverts, book orders, gifts) is
// replaced by WhatsApp / call buttons, and the server refuses form posts.
// The form code is kept so it can be switched back on later — e.g. after
// registering with the Data Protection Commission — by setting this to true
// (and re-granting the database permissions; see the migration
// 20261023200000_forms_off.sql).
export const ONLINE_FORMS_ENABLED = false;

export const WHATSAPP_NUMBER = "233597573842";
export const PHONE_DISPLAY = "+233 59 757 3842";
export const FORMS_OFF_MESSAGE = "Online forms are closed. Please message us on WhatsApp or call " + PHONE_DISPLAY + ".";

export function whatsappLink(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
