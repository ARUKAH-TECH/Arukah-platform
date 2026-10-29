"use server";

import { FORMS_OFF_MESSAGE, ONLINE_FORMS_ENABLED } from "@/config/forms";
import { SERVICE_OPTIONS, type ContactFormState } from "@/features/contact/shared";
import { saveInboxMessage } from "@/db/inbox";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitEnquiry(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  if (!ONLINE_FORMS_ENABLED) return { status: "error", message: FORMS_OFF_MESSAGE };
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company_website")) {
    return { status: "success", message: "Thanks: we'll be in touch soon." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!fullName || !service || !message) {
    return {
      status: "error",
      message: "Please fill in your name, service, and message.",
    };
  }

  if (!phone && !email) {
    return {
      status: "error",
      message: "Please provide a phone number or an email so we can reach you.",
    };
  }

  if (email && !isValidEmail(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  if (!(SERVICE_OPTIONS as readonly string[]).includes(service)) {
    return { status: "error", message: "Please choose a valid service." };
  }

  if (fullName.length > 200 || organization.length > 200 || phone.length > 40 || email.length > 200 || message.length > 5000) {
    return { status: "error", message: "That input is too long." };
  }

  // Saved to Admin → Inbox (visitors can send but never read messages).
  const saved = await saveInboxMessage({
    kind: "enquiry",
    fullName,
    organization,
    phone,
    email,
    topic: service,
    message,
  });
  if (saved !== true) {
    return { status: "error", message: saved };
  }

  return {
    status: "success",
    message: "Thanks! Your message has been received. We'll get back to you soon.",
  };
}
