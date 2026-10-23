"use server";

import { FORMS_OFF_MESSAGE, ONLINE_FORMS_ENABLED } from "@/config/forms";
import { FAITH_STATUS_OPTIONS, type MinistryFormState } from "@/features/ministry/shared";
import { saveInboxMessage } from "@/db/inbox";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitMinistryResponse(
  _prevState: MinistryFormState,
  formData: FormData,
): Promise<MinistryFormState> {
  if (!ONLINE_FORMS_ENABLED) return { status: "error", message: FORMS_OFF_MESSAGE };
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

  if (fullName.length > 200 || phone.length > 40 || email.length > 200 || message.length > 5000) {
    return { status: "error", message: "That input is too long." };
  }

  // Saved to Admin → Inbox. Faith and prayer details are personal, so only
  // verified admins can read them, and they are never written to logs.
  const saved = await saveInboxMessage({
    kind: "ministry",
    fullName,
    phone,
    email,
    topic: faithStatus,
    message,
  });
  if (saved !== true) {
    return { status: "error", message: saved };
  }

  return {
    status: "success",
    message: "Thank you for reaching out — someone from the ministry will follow up with you soon.",
  };
}
