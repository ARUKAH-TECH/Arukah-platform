// Ready-made WhatsApp messages for programme participants. The admin's own
// WhatsApp opens with the text typed in; they can change it before sending.

import { formatWhen, platformName, scheduleText } from "@/features/programmes/shared";

export const MESSAGE_KINDS = ["confirmation", "approved", "reminder", "change", "cancellation"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export const MESSAGE_LABELS: Record<MessageKind | "code", string> = {
  confirmation: "Registration confirmation",
  approved: "Place approved",
  code: "New secret code",
  reminder: "Reminder",
  change: "Time or date change",
  cancellation: "Programme cancelled",
};

export interface MessageProgramme {
  title: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  scheduleNote: string;
  platform: string;
  platformName: string;
  priceGhs: number;
}

const ACCESS = "https://zivarukah.com/programmes/access";
const FOOTER = "\n\nZIVARUKAH · Reply STOP to stop these messages.";

export function whenText(p: MessageProgramme) {
  return scheduleText(p.scheduleNote, p.startsAt, p.endsAt, p.timeZone);
}

export function messageText(kind: MessageKind, p: MessageProgramme, name: string, paid: boolean) {
  const first = name.trim().split(/\s+/)[0] || "there";
  const where = platformName(p.platform, p.platformName);
  const when = whenText(p);
  switch (kind) {
    case "confirmation":
      return `Hello ${first}, thank you for registering for "${p.title}" (${when}, online on ${where}).\n\nKeep your secret code safe: you will enter it at ${ACCESS} to see how to join.${FOOTER}`;
    case "approved":
      return `Good news, ${first}! Your place in "${p.title}" is approved.\n\nEnter your secret code at ${ACCESS} to see the joining details. ${when}, on ${where}.${FOOTER}`;
    case "reminder":
      return `Reminder, ${first}: "${p.title}" ${p.scheduleNote ? `(${when}) is coming up` : `starts ${formatWhen(p.startsAt, p.timeZone)}`} on ${where}.\n\nOpen ${ACCESS} and enter your secret code to join. See you there!${FOOTER}`;
    case "change":
      return `Hello ${first}, an update for "${p.title}": it is now ${when}, online on ${where}.\n\nYour secret code stays the same: ${ACCESS}${FOOTER}`;
    case "cancellation":
      return `Hello ${first}, we are sorry: "${p.title}" (${when}) has been cancelled.${paid ? " We will contact you about your refund." : ""}\n\nThank you for your understanding.${FOOTER}`;
  }
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
