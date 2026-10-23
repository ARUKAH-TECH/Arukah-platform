import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export interface NewInboxMessage {
  kind: "enquiry" | "ministry";
  fullName: string;
  organization?: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
}

/**
 * Stores a message from a public form in the admin Inbox. Visitors can only
 * insert (never read) messages, so nothing is returned. Returns false if it
 * couldn't be saved, so the form can ask the visitor to try again.
 */
export async function saveInboxMessage(input: NewInboxMessage): Promise<boolean> {
  let client;
  try {
    client = createPublicClient();
  } catch {
    console.error("[inbox] Supabase not configured");
    return false;
  }
  const { error } = await client.from("inbox_messages").insert({
    kind: input.kind,
    full_name: input.fullName,
    organization: input.organization ?? "",
    phone: input.phone,
    email: input.email,
    topic: input.topic,
    message: input.message,
  });
  if (error) {
    // Never log the visitor's details — only that saving failed.
    console.error(`[inbox] saving a ${input.kind} message failed`, error.message);
    return false;
  }
  return true;
}
