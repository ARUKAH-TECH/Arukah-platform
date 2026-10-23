"use client";

import { useRef, useState, useTransition } from "react";
import { submitAdRequest } from "@/features/advertise/actions";
import { initialAdvertiseFormState, type AdvertiseFormState } from "@/features/advertise/shared";
import { ACCEPTED_IMAGE_TYPES, resize } from "@/lib/resizeImage";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-primary-text dark:border-white/15";

export function AdvertiseForm() {
  const [state, setState] = useState<AdvertiseFormState>(initialAdvertiseFormState);
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setState(initialAdvertiseFormState);
      const photo = photoInput.current?.files?.[0];
      if (photo) {
        if (!ACCEPTED_IMAGE_TYPES.includes(photo.type)) {
          setState({ status: "error", message: "The photo must be a JPEG, PNG or WebP image." });
          return;
        }
        try {
          setStep("Preparing your photo…");
          // Shrinks the photo and removes location data before it leaves the phone.
          const { blob } = await resize(photo);
          const path = `requests/${crypto.randomUUID()}.webp`;
          setStep("Uploading your photo…");
          const { error } = await createClient()
            .storage.from("ad-requests")
            .upload(path, blob, { contentType: "image/webp" });
          if (error) throw new Error(error.message);
          formData.set("imagePath", path);
        } catch {
          setStep("");
          setState({ status: "error", message: "Your photo couldn't be uploaded. Try a smaller photo, or send without one." });
          return;
        }
      }
      setStep("Sending…");
      const result = await submitAdRequest(formData);
      setStep("");
      setState(result);
    });
  }

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-2xl bg-green-50 p-6 text-sm font-medium text-green-900 dark:bg-green-950 dark:text-green-200">
        {state.message}
      </p>
    );
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactName" className="block text-sm font-medium">
            Your name
          </label>
          <input id="contactName" name="contactName" required maxLength={150} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium">
            Business name <span className="font-normal text-foreground/50">(optional)</span>
          </label>
          <input id="businessName" name="businessName" maxLength={150} className={inputClasses} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="adPhone" className="block text-sm font-medium">
            Phone / WhatsApp
          </label>
          <input id="adPhone" name="phone" type="tel" maxLength={40} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="adEmail" className="block text-sm font-medium">
            Email <span className="font-normal text-foreground/50">(optional)</span>
          </label>
          <input id="adEmail" name="email" type="email" maxLength={200} className={inputClasses} />
        </div>
      </div>

      <div>
        <label htmlFor="about" className="block text-sm font-medium">
          What is the advert about?
        </label>
        <textarea id="about" name="about" required rows={4} maxLength={3000} className={inputClasses} />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          Location <span className="font-normal text-foreground/50">(town / area)</span>
        </label>
        <input id="location" name="location" maxLength={200} className={inputClasses} />
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium">
          Photo or flyer <span className="font-normal text-foreground/50">(optional — a wide photo works best)</span>
        </label>
        <input id="photo" ref={photoInput} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="mt-1 text-sm" />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? step || "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
