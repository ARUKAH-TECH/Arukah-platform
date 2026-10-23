import { BRANCHES } from "@/config/branches";

export interface AdvertiseFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialAdvertiseFormState: AdvertiseFormState = { status: "idle", message: "" };

/** Where advertisers may ask to appear. The ministry never carries commercial ads. */
export const AD_PLACEMENT_OPTIONS = BRANCHES.filter((branch) => branch.id !== "ministry");
