export interface ContactFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export const SERVICE_OPTIONS = [
  "ARUKAH TECH",
  "ARUKAH WEAR",
  "ZIVA Special Classes",
  "Other",
] as const;

export const initialContactFormState: ContactFormState = { status: "idle", message: "" };
