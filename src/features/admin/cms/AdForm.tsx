"use client";

import { useActionState, useRef, useState } from "react";
import { saveAd } from "@/features/admin/cms/adActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { AD_BRANCHES, AD_TONE_CLASSES, adStatus } from "@/features/admin/cms/adStatus";
import { ACCEPTED_IMAGE_TYPES, resize } from "@/features/admin/cms/resizeImage";
import { createClient } from "@/lib/supabase/browser";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

export interface AdFormValues {
  id?: string;
  advertiserId: string;
  headline: string;
  body: string;
  ctaLabel: string;
  imagePath: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  destinationUrl: string;
  placements: string[];
  contentStatus: string;
  paymentConfirmed: boolean;
  startsOn: string;
  endsOn: string;
  amountGhs: string;
  paymentReference: string;
  paymentNote: string;
}

interface AdvertiserOption {
  id: string;
  name: string;
  status: string;
}

function publicImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

export function AdForm({
  ad,
  advertisers,
  justSaved,
}: {
  ad: AdFormValues;
  advertisers: AdvertiserOption[];
  justSaved?: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveAd, initialCmsFormState);
  const [advertiserId, setAdvertiserId] = useState(ad.advertiserId);
  const [contentStatus, setContentStatus] = useState(ad.contentStatus);
  const [paid, setPaid] = useState(ad.paymentConfirmed);
  const [startsOn, setStartsOn] = useState(ad.startsOn);
  const [endsOn, setEndsOn] = useState(ad.endsOn);
  const [image, setImage] = useState({ path: ad.imagePath, width: ad.imageWidth, height: ad.imageHeight });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const advertiser = advertisers.find((option) => option.id === advertiserId);
  const status = adStatus({
    advertiserStatus: advertiser?.status ?? "pending",
    contentStatus,
    paymentConfirmed: paid,
    startsOn,
    endsOn,
  });
  const shownMessage = state.status !== "idle" ? state : justSaved ? { status: "saved", message: "Saved." } : null;

  async function uploadImage() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Only JPEG, PNG or WebP images can be used.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const { blob, width, height } = await resize(file);
      const path = `ads/${crypto.randomUUID()}.webp`;
      const { error } = await createClient()
        .storage.from("media")
        .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      setImage({ path, width, height });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {ad.id && <input type="hidden" name="id" value={ad.id} />}
      <input type="hidden" name="imagePath" value={image.path ?? ""} />
      <input type="hidden" name="imageWidth" value={image.width ?? ""} />
      <input type="hidden" name="imageHeight" value={image.height ?? ""} />

      <div className={`rounded-xl px-4 py-3 text-sm ${AD_TONE_CLASSES[status.tone]}`}>
        <span className="font-semibold">{status.label}</span>
        {status.missing.length > 0 && <span> — still needs {status.missing.join(", ")}.</span>}
        {status.tone === "live" && <span> — showing on the chosen pages (if those pages accept adverts).</span>}
      </div>

      <div>
        <label htmlFor="advertiserId" className="block text-sm font-medium">
          Advertiser
        </label>
        <select
          id="advertiserId"
          name="advertiserId"
          required
          value={advertiserId}
          onChange={(event) => setAdvertiserId(event.target.value)}
          className={fieldClasses}
        >
          <option value="" disabled>
            Choose…
          </option>
          {advertisers.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} ({option.status})
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <legend className="px-1 text-sm font-semibold">The advert</legend>
        <div>
          <label htmlFor="headline" className="block text-sm font-medium">
            Headline <span className="font-normal text-foreground/50">(max 100)</span>
          </label>
          <input id="headline" name="headline" required maxLength={100} defaultValue={ad.headline} className={fieldClasses} />
        </div>
        <div>
          <label htmlFor="adBody" className="block text-sm font-medium">
            Short text <span className="font-normal text-foreground/50">(optional, max 200)</span>
          </label>
          <textarea id="adBody" name="body" rows={2} maxLength={200} defaultValue={ad.body} className={fieldClasses} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="destinationUrl" className="block text-sm font-medium">
              Link to <span className="font-normal text-foreground/50">(https://…)</span>
            </label>
            <input
              id="destinationUrl"
              name="destinationUrl"
              required
              maxLength={500}
              defaultValue={ad.destinationUrl}
              placeholder="https://"
              className={fieldClasses}
            />
          </div>
          <div>
            <label htmlFor="ctaLabel" className="block text-sm font-medium">
              Button text
            </label>
            <input id="ctaLabel" name="ctaLabel" maxLength={30} defaultValue={ad.ctaLabel} placeholder="Visit" className={fieldClasses} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">Image <span className="font-normal text-foreground/50">(optional)</span></p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {image.path && (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of the uploaded advert image
              <img src={publicImageUrl(image.path)} alt="" className="h-20 w-28 rounded-lg object-cover" />
            )}
            <input ref={fileInput} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="text-sm" />
            <button type="button" onClick={uploadImage} disabled={uploading} className={secondaryButtonClasses}>
              {uploading ? "Uploading…" : image.path ? "Replace image" : "Upload image"}
            </button>
            {image.path && (
              <button type="button" onClick={() => setImage({ path: null, width: null, height: null })} className="text-xs underline">
                Remove image
              </button>
            )}
          </div>
          {uploadError && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{uploadError}</p>}
          <p className="mt-1 text-xs text-foreground/50">Remember to press Save after uploading.</p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <legend className="px-1 text-sm font-semibold">Where and when</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AD_BRANCHES.map((branch) => (
            <label key={branch.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="placements" value={branch.id} defaultChecked={ad.placements.includes(branch.id)} />
              {branch.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-foreground/50">Adverts can never be placed on the ministry pages.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startsOn" className="block text-sm font-medium">
              First day
            </label>
            <input
              id="startsOn"
              name="startsOn"
              type="date"
              required
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              className={fieldClasses}
            />
          </div>
          <div>
            <label htmlFor="endsOn" className="block text-sm font-medium">
              Last day
            </label>
            <input
              id="endsOn"
              name="endsOn"
              type="date"
              required
              value={endsOn}
              onChange={(event) => setEndsOn(event.target.value)}
              className={fieldClasses}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <legend className="px-1 text-sm font-semibold">Approvals</legend>
        <p className="text-xs text-foreground/60">
          1. Advertiser: <strong>{advertiser?.status ?? "—"}</strong> (change it under Advertisers).
        </p>
        <div>
          <p className="text-xs text-foreground/60">2. Advert content:</p>
          <div className="mt-1 flex flex-wrap gap-4 text-sm">
            {["pending", "approved", "rejected"].map((value) => (
              <label key={value} className="flex items-center gap-2 capitalize">
                <input
                  type="radio"
                  name="contentStatus"
                  value={value}
                  checked={contentStatus === value}
                  onChange={() => setContentStatus(value)}
                />
                {value}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-foreground/60">3. Payment:</p>
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input type="checkbox" name="paymentConfirmed" checked={paid} onChange={(event) => setPaid(event.target.checked)} />
            Payment received and confirmed
          </label>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="amountGhs" className="block text-xs font-medium">
                Amount (GHS) <span className="font-normal text-foreground/50">(private)</span>
              </label>
              <input id="amountGhs" name="amountGhs" inputMode="decimal" defaultValue={ad.amountGhs} className={fieldClasses} />
            </div>
            <div>
              <label htmlFor="paymentReference" className="block text-xs font-medium">
                Payment reference <span className="font-normal text-foreground/50">(MoMo/bank, private)</span>
              </label>
              <input id="paymentReference" name="paymentReference" maxLength={200} defaultValue={ad.paymentReference} className={fieldClasses} />
            </div>
          </div>
          <label htmlFor="paymentNote" className="mt-3 block text-xs font-medium">
            Note <span className="font-normal text-foreground/50">(private, e.g. agreed package)</span>
          </label>
          <textarea id="paymentNote" name="paymentNote" rows={2} maxLength={1000} defaultValue={ad.paymentNote} className={fieldClasses} />
        </div>
      </fieldset>

      {shownMessage && (
        <p
          role={shownMessage.status === "error" ? "alert" : "status"}
          className={shownMessage.status === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}
        >
          {shownMessage.message}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending || uploading} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save advert"}
        </button>
      </div>
    </form>
  );
}
