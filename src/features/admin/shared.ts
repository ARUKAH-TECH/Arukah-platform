export interface AdminFormState {
  status: "idle" | "error";
  message: string;
}

export const initialAdminFormState: AdminFormState = { status: "idle", message: "" };

export interface MfaEnrollState {
  status: "idle" | "error" | "enrolling";
  message: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
}

export const initialMfaEnrollState: MfaEnrollState = { status: "idle", message: "" };
