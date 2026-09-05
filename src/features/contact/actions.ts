"use server";

import { SERVICE_OPTIONS, type ContactFormState } from "@/features/contact/shared";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitEnquiry(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company_website")) {
    return { status: "success", message: "Thanks — we'll be in touch soon." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!fullName || !email || !service || !message) {
    return {
      status: "error",
      message: "Please fill in your name, email, service, and message.",
    };
  }

  if (!isValidEmail(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  if (!(SERVICE_OPTIONS as readonly string[]).includes(service)) {
    return { status: "error", message: "Please choose a valid service." };
  }

  if (fullName.length > 200 || message.length > 5000) {
    return { status: "error", message: "That input is too long." };
  }

  // Temporary Phase 5 handling: no database or email provider is configured
  // yet (see docs/ENVIRONMENT.md), so enquiries are logged to the server's
  // own function logs. Phase 8 replaces this with real storage/email.
  console.log("[ARUKAH enquiry]", {
    fullName,
    organization: organization || undefined,
    phone: phone || undefined,
    email,
    service,
    message,
    receivedAt: new Date().toISOString(),
  });

  return {
    status: "success",
    message: "Thanks! Your message has been received. We'll get back to you soon.",
  };
}
