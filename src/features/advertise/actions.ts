"use server";

import { FORMS_OFF_MESSAGE, ONLINE_FORMS_ENABLED } from "@/config/forms";
import { createPublicClient } from "@/lib/supabase/public";
import { rateLimitMessage } from "@/lib/friendlyLimit";
import { REQUEST_IMAGE_PATH, type AdvertiseFormState } from "@/features/advertise/shared";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Saves a new advert request. Visitors can send requests but never read them. */
export async function submitAdRequest(formData: FormData): Promise<AdvertiseFormState> {
  if (!ONLINE_FORMS_ENABLED) return { status: "error", message: FORMS_OFF_MESSAGE };
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company_website")) {
    return { status: "success", message: "Thank you: we'll get back to you." };
  }

  const contactName = field(formData, "contactName");
  const businessName = field(formData, "businessName");
  const phone = field(formData, "phone");
  const email = field(formData, "email");
  const about = field(formData, "about");
  const location = field(formData, "location");
  const imagePath = field(formData, "imagePath");

  if (!contactName || !about) {
    return { status: "error", message: "Please enter your name and what the advert is about." };
  }
  if (!phone && !email) {
    return { status: "error", message: "Please give a phone number or an email so we can reach you." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (phone && !/^[+\d][\d\s()-]{5,39}$/.test(phone)) {
    return { status: "error", message: "Please enter a valid phone number." };
  }
  if (imagePath && !REQUEST_IMAGE_PATH.test(imagePath)) {
    return { status: "error", message: "The photo couldn't be attached. Please try again." };
  }
  if (contactName.length > 150 || businessName.length > 150 || email.length > 200 || about.length > 3000 || location.length > 200) {
    return { status: "error", message: "Some answers are too long. Please shorten them." };
  }

  let supabase;
  try {
    supabase = createPublicClient();
  } catch {
    return { status: "error", message: "Requests can't be received right now. Please use the contact page." };
  }

  const { error } = await supabase.from("ad_requests").insert({
    contact_name: contactName,
    business_name: businessName,
    phone,
    email,
    about,
    location,
    request_image_path: imagePath || null,
  });
  if (error) {
    console.error("[advertise] request insert failed", error.message);
    return { status: "error", message: rateLimitMessage(error) ?? "Sorry, something went wrong. Please try again in a moment." };
  }

  return {
    status: "success",
    message: "Thank you! Your advert request has been received. We'll contact you about dates and payment.",
  };
}
