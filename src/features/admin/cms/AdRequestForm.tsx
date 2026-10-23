"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveAdRequest } from "@/features/admin/cms/adRequestActions";
import { initialCmsFormState, toInputDateTime } from "@/features/admin/cms/shared";
import { ACCEPTED_IMAGE_TYPES, resize } from "@/lib/resizeImage";
import { createClient } from "@/lib/supabase/browser";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

export interface AdRequestFormValues {
  id: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  amountGhs: string;
  paymentStatus: string;
  paymentReference: string;
  displayKind: "image" | "video";
  displayImagePath: string | null;
  hasRequesterPhoto: boolean;
  videoUrl: string;
  linkUrl: string;
  adminNote: string;
  displaySeconds: number;
}

function publicImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

function Choice({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm ${
        checked ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

export function AdRequestForm({ values }: { values: AdRequestFormValues }) {
  const [state, formAction, pending] = useActionState(saveAdRequest, initialCmsFormState);
  const [status, setStatus] = useState(values.status);
  const [paid, setPaid] = useState(values.paymentStatus);
  const [kind, setKind] = useState(values.displayKind);
  const [imageChoice, setImageChoice] = useState(
    values.displayImagePath ? "keep" : values.hasRequesterPhoto ? "requester" : "uploaded",
  );
  const [uploaded, setUploaded] = useState<{ path: string; width: number; height: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // After a successful save the chosen image is stored, so the next save keeps it
  // (instead of copying the requester's photo again).
  useEffect(() => {
    if (state.status === "saved" && kind === "image" && values.displayImagePath) {
      setImageChoice("keep");
      setUploaded(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }, [state, kind, values.displayImagePath]);

  async function upload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return setUploadError("Use a JPEG, PNG or WebP image.");
    setUploading(true);
    setUploadError("");
    try {
      const { blob, width, height } = await resize(file, 1200, 0.82);
      const path = `ads/${crypto.randomUUID()}.webp`;
      const { error } = await createClient()
        .storage.from("media")
        .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      setUploaded({ path, width, height });
      setImageChoice("uploaded");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={values.id} />
      <input type="hidden" name="imageChoice" value={imageChoice} />
      <input type="hidden" name="uploadedPath" value={uploaded?.path ?? ""} />
      <input type="hidden" name="uploadedWidth" value={uploaded?.width ?? ""} />
      <input type="hidden" name="uploadedHeight" value={uploaded?.height ?? ""} />

      <fieldset>
        <legend className="text-sm font-semibold">Decision</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Choice name="status" value="pending" checked={status === "pending"} onChange={() => setStatus("pending")}>
            Pending
          </Choice>
          <Choice name="status" value="approved" checked={status === "approved"} onChange={() => setStatus("approved")}>
            Approve
          </Choice>
          <Choice name="status" value="rejected" checked={status === "rejected"} onChange={() => setStatus("rejected")}>
            Reject
          </Choice>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">When it shows <span className="font-normal text-foreground/50">(Ghana time)</span></legend>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Start
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={toInputDateTime(values.startsAt)}
              required={status === "approved"}
              className={fieldClasses}
            />
          </label>
          <label className="text-sm">
            End
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={toInputDateTime(values.endsAt)}
              required={status === "approved"}
              className={fieldClasses}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Payment</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Choice name="paymentStatus" value="unpaid" checked={paid === "unpaid"} onChange={() => setPaid("unpaid")}>
            Not paid
          </Choice>
          <Choice name="paymentStatus" value="part" checked={paid === "part"} onChange={() => setPaid("part")}>
            Part paid
          </Choice>
          <Choice name="paymentStatus" value="full" checked={paid === "full"} onChange={() => setPaid("full")}>
            Full paid
          </Choice>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Amount paid (GHS)
            <input name="amountGhs" inputMode="decimal" defaultValue={values.amountGhs} className={fieldClasses} />
          </label>
          <label className="text-sm">
            Reference <span className="text-foreground/50">(MoMo / bank)</span>
            <input name="paymentReference" maxLength={200} defaultValue={values.paymentReference} className={fieldClasses} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Show as</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Choice name="displayKind" value="image" checked={kind === "image"} onChange={() => setKind("image")}>
            Image (top banner)
          </Choice>
          <Choice name="displayKind" value="video" checked={kind === "video"} onChange={() => setKind("video")}>
            Video
          </Choice>
        </div>

        {kind === "image" ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-black/10 p-4 text-sm dark:border-white/10">
            {values.displayImagePath && (
              <label className="flex flex-col gap-2">
                <span className="flex items-center gap-2">
                  <input type="radio" checked={imageChoice === "keep"} onChange={() => setImageChoice("keep")} />
                  Keep the current image
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                <img src={publicImageUrl(values.displayImagePath)} alt="" className="aspect-[8/1] w-full rounded-lg object-cover" />
              </label>
            )}
            {values.hasRequesterPhoto && (
              <label className="flex items-center gap-2">
                <input type="radio" checked={imageChoice === "requester"} onChange={() => setImageChoice("requester")} />
                Use the photo the requester sent (shown on the left)
              </label>
            )}
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={imageChoice === "uploaded"}
                  onChange={() => setImageChoice("uploaded")}
                  disabled={!uploaded}
                />
                Upload a different image <span className="text-foreground/50">(wide, ideally 1200 × 150)</span>
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <input ref={fileInput} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="text-sm" />
                <button type="button" onClick={upload} disabled={uploading} className={secondaryButtonClasses}>
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
              {uploaded && (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview
                <img src={publicImageUrl(uploaded.path)} alt="" className="aspect-[8/1] w-full rounded-lg object-cover" />
              )}
              {uploadError && <p className="text-xs text-red-700 dark:text-red-400">{uploadError}</p>}
            </div>
            <p className="text-xs text-foreground/50">
              The whole image is shrunk to fit the slim banner. Wide images (about 8 times wider than tall) fill it best.
            </p>
          </div>
        ) : (
          <label className="mt-4 block text-sm">
            YouTube or TikTok link
            <input name="videoUrl" defaultValue={values.videoUrl} placeholder="https://youtu.be/…" className={fieldClasses} />
          </label>
        )}
      </fieldset>

      <label className="text-sm">
        Seconds on screen{" "}
        <span className="text-foreground/50">(when two or more adverts are showing, each stays this long before the next)</span>
        <input
          name="displaySeconds"
          type="number"
          min={3}
          max={120}
          defaultValue={values.displaySeconds}
          className={`${fieldClasses} max-w-[8rem]`}
        />
      </label>

      <label className="text-sm">
        Link when clicked <span className="text-foreground/50">(optional — their website, Facebook or WhatsApp link)</span>
        <input name="linkUrl" defaultValue={values.linkUrl} placeholder="https://…" className={fieldClasses} />
      </label>

      <label className="text-sm">
        Private note
        <textarea name="adminNote" rows={2} maxLength={2000} defaultValue={values.adminNote} className={fieldClasses} />
      </label>

      {state.status !== "idle" && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}
        >
          {state.message}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending || uploading} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
