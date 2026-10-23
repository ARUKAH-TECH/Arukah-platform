"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { AD_PLACEMENT_OPTIONS, type AdvertiseFormState } from "@/features/advertise/shared";

const ALLOWED_PLACEMENTS: readonly string[] = AD_PLACEMENT_OPTIONS.map((branch) => branch.id);

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitAdvertiserApplication(
  _prev: AdvertiseFormState,
  formData: FormData,
): Promise<AdvertiseFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company_website")) {
    return { status: "success", message: "Thank you — we'll review your application and get back to you." };
  }

  const businessName = field(formData, "businessName");
  const contactName = field(formData, "contactName");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  let website = field(formData, "website");
  const message = field(formData, "message");
  const interestedIn = formData
    .getAll("interestedIn")
    .map(String)
    .filter((id) => ALLOWED_PLACEMENTS.includes(id));

  if (!businessName || !contactName) {
    return { status: "error", message: "Please enter your business name and your name." };
  }
  if (!email && !phone) {
    return { status: "error", message: "Please give a phone number or an email so we can reach you." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (phone && !/^[+\d][\d\s()-]{5,39}$/.test(phone)) {
    return { status: "error", message: "Please enter a valid phone number." };
  }
  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      const url = new URL(website);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("bad scheme");
      website = url.toString();
    } catch {
      return { status: "error", message: "Please enter a valid website address, or leave it empty." };
    }
  }
  if (
    businessName.length > 150 ||
    contactName.length > 150 ||
    email.length > 200 ||
    website.length > 300 ||
    message.length > 3000
  ) {
    return { status: "error", message: "Some of your answers are too long. Please shorten them." };
  }

  let supabase;
  try {
    supabase = createPublicClient();
  } catch {
    return { status: "error", message: "Applications can't be received right now. Please use the contact page." };
  }

  // Visitors can insert but never read applications, so don't ask for the row back.
  const { error } = await supabase.from("advertisers").insert({
    business_name: businessName,
    contact_name: contactName,
    email,
    phone,
    website,
    interested_in: interestedIn,
    message,
  });
  if (error) {
    console.error("[advertise] application insert failed", error.message);
    return { status: "error", message: "Sorry, something went wrong. Please try again in a moment." };
  }

  return {
    status: "success",
    message: "Thank you! Your application has been received. We'll review it and contact you about next steps.",
  };
}
