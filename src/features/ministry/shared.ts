export interface MinistryFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export const FAITH_STATUS_OPTIONS = [
  "New convert — I just gave my life to Christ",
  "Rededicating my life",
  "Already a believer — I want to grow deeper",
] as const;

export const initialMinistryFormState: MinistryFormState = { status: "idle", message: "" };
