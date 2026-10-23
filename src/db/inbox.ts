import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { rateLimitMessage } from "@/lib/friendlyLimit";

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
 * insert (never read) messages, so nothing is returned. Returns true when
 * saved, or a message for the visitor when it couldn't be (e.g. a spam limit).
 */
export async function saveInboxMessage(input: NewInboxMessage): Promise<true | string> {
  let client;
  try {
    client = createPublicClient();
  } catch {
    console.error("[inbox] Supabase not configured");
    return "Sorry, your message couldn't be sent just now. Please try again in a moment.";
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
    return rateLimitMessage(error) ?? "Sorry, your message couldn't be sent just now. Please try again in a moment.";
  }
  return true;
}
