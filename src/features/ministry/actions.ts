"use server";

import { FAITH_STATUS_OPTIONS, type MinistryFormState } from "@/features/ministry/shared";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitMinistryResponse(
  _prevState: MinistryFormState,
  formData: FormData,
): Promise<MinistryFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company_website")) {
    return { status: "success", message: "Thank you — someone from the ministry will reach out." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const faithStatus = String(formData.get("faithStatus") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!fullName || !faithStatus) {
    return {
      status: "error",
      message: "Please share your name and where you are in your faith journey.",
    };
  }

  if (!phone && !email) {
    return {
      status: "error",
      message: "Please provide a phone number or an email so we can follow up with you.",
    };
  }

  if (email && !isValidEmail(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  if (!(FAITH_STATUS_OPTIONS as readonly string[]).includes(faithStatus)) {
    return { status: "error", message: "Please choose a valid option." };
  }

  if (fullName.length > 200 || message.length > 5000) {
    return { status: "error", message: "That input is too long." };
  }

  // Temporary handling, same as the general enquiry form (see
  // src/features/contact/actions.ts and docs/ARCHITECTURE.md): no database
  // or email provider is configured yet, so responses are logged to the
  // server's own function logs for the ministry team to follow up on
  // manually until Phase 8 adds real storage.
  console.log("[ARUKAH ministry response]", {
    fullName,
    phone: phone || undefined,
    email: email || undefined,
    faithStatus,
    message: message || undefined,
    receivedAt: new Date().toISOString(),
  });

  return {
    status: "success",
    message: "Thank you for reaching out — someone from the ministry will follow up with you soon.",
  };
}
