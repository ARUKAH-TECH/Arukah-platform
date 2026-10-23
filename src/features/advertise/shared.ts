export interface AdvertiseFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialAdvertiseFormState: AdvertiseFormState = { status: "idle", message: "" };

/** Photo paths the request form may submit (uploaded to the private "ad-requests" bucket). */
export const REQUEST_IMAGE_PATH = /^requests\/[0-9a-f-]{36}\.webp$/;
