// The database's spam limits raise these messages; they're written for
// visitors, so forms can show them as they are.
const LIMIT_MESSAGES = [/sent several requests already/i, /receiving a lot of requests/i];

export function rateLimitMessage(error: { message?: string } | null | undefined): string | null {
  const message = error?.message ?? "";
  return LIMIT_MESSAGES.some((pattern) => pattern.test(message)) ? message : null;
}
