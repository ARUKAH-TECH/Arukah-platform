"use client";

import { useActionState, useRef, useState } from "react";
import { saveProgramme } from "@/features/admin/cms/programmeActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { ACTIVE_BRANCHES } from "@/config/branches";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";
import { createClient } from "@/lib/supabase/browser";
import { IMAGE_PICKER_ACCEPT, resize } from "@/lib/resizeImage";
import { branchForCategory, LINK_RELEASES, LINK_RELEASE_LABELS, PLATFORMS, PLATFORM_LABELS, PROGRAMME_STATUSES, PROGRAMME_STATUS_LABELS, TIME_ZONES, isoToZonedInput } from "@/features/programmes/shared";

export interface ProgrammeFormValues {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  imagePath: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  startsAt: string | null;
  endsAt: string | null;
  timeZone: string;
  scheduleNote: string;
  regOpensAt: string | null;
  regClosesAt: string | null;
  capacity: number | null;
  priceGhs: number;
  approval: "auto" | "manual";
  status: string;
  platform: string;
  platformName: string;
  codeValidHours: number;
  codeSingleUse: boolean;
  linkRelease: string;
  branches: string[];
  joinLink: string;
  joinInstructions: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Pill({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm ${checked ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

export function ProgrammeForm({ values, justSaved }: { values: ProgrammeFormValues; justSaved?: boolean }) {
  const [state, formAction, pending] = useActionState(saveProgramme, initialCmsFormState);
  const [tz, setTz] = useState(values.timeZone);
  const [platform, setPlatform] = useState(values.platform);
  const [paid, setPaid] = useState(values.priceGhs > 0);
  const [approval, setApproval] = useState(values.approval);
  const [branches, setBranches] = useState<string[]>(values.branches);
  // Until the admin ticks boxes themselves, follow the category ("Ministry" → Ministry page).
  const [branchesTouched, setBranchesTouched] = useState(Boolean(values.id));
  function onCategory(value: string) {
    if (branchesTouched) return;
    const matched = branchForCategory(value);
    setBranches(matched ? ["home", matched] : ["home"]);
  }
  const [image, setImage] = useState<{ path: string; width: number | null; height: number | null } | null>(
    values.imagePath ? { path: values.imagePath, width: values.imageWidth, height: values.imageHeight } : null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const shown = state.status !== "idle" ? state : justSaved ? { status: "saved", message: "Saved." } : null;
  const local = (iso: string | null) => isoToZonedInput(iso, values.timeZone);

  async function upload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const { blob, width, height } = await resize(file, 1600, 0.82);
      const id = crypto.randomUUID();
      const path = `programmes/${id}.webp`;
      const storage = createClient().storage.from("media");
      const { error } = await storage.upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      // A JPEG copy next to it, for WhatsApp/Facebook link previews and for sharing the flyer itself.
      const jpeg = await resize(file, 1200, 0.85, "image/jpeg");
      const { error: jpegError } = await storage.upload(`programmes/${id}.jpg`, jpeg.blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (jpegError) throw new Error(jpegError.message);
      setImage({ path, width, height });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="imagePath" value={image?.path ?? ""} />
      <input type="hidden" name="imageWidth" value={image?.width ?? ""} />
      <input type="hidden" name="imageHeight" value={image?.height ?? ""} />

      <Section title="About the programme">
        <label className="text-sm">
          Title *
          <input name="title" required minLength={3} maxLength={140} defaultValue={values.title} className={fieldClasses} />
        </label>
        <label className="text-sm">
          Category <span className="text-foreground/60">(e.g. Nursing, Bible study, Tech training)</span>
          <input name="category" maxLength={60} defaultValue={values.category} onChange={(e) => onCategory(e.target.value)} className={fieldClasses} />
        </label>
        <label className="text-sm">
          Short summary <span className="text-foreground/60">(one or two lines, shown on the list)</span>
          <textarea name="summary" rows={2} maxLength={300} defaultValue={values.summary} className={fieldClasses} />
        </label>
        <label className="text-sm">
          Full description
          <textarea name="description" rows={6} maxLength={6000} defaultValue={values.description} className={fieldClasses} />
        </label>
        <div className="text-sm">
          Banner picture
          {image && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded image
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${image.path}`}
              alt=""
              className="mt-2 max-h-48 rounded-xl object-cover"
            />
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <input ref={fileInput} type="file" accept={IMAGE_PICKER_ACCEPT} onChange={upload} className="hidden" id="programme-image" />
            <label htmlFor="programme-image" className="cursor-pointer rounded-full border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/15">
              {uploading ? "Uploading…" : image ? "Change picture" : "📷 Add picture"}
            </label>
            {image && (
              <button type="button" onClick={() => setImage(null)} className="rounded-full px-4 py-2 text-sm text-red-700 dark:text-red-400">
                Remove picture
              </button>
            )}
          </div>
          {uploadError && <p className="mt-1 text-xs text-red-700">{uploadError}</p>}
        </div>
        <label className="text-sm">
          Web address <span className="text-foreground/60">(zivarukah.com/programmes/…; leave empty to make one from the title)</span>
          <input name="slug" maxLength={80} defaultValue={values.slug} placeholder="free-nursing-class" className={fieldClasses} />
        </label>
      </Section>

      <Section title="Date and time">
        <label className="text-sm">
          Time zone
          <select name="timeZone" value={tz} onChange={(e) => setTz(e.target.value)} className={fieldClasses}>
            {TIME_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
          {tz !== values.timeZone && values.id && (
            <span className="mt-1 block text-xs text-amber-700">The times below will be read in the new time zone when you save.</span>
          )}
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Starts *
            <input name="startsAt" type="datetime-local" required defaultValue={local(values.startsAt)} className={fieldClasses} />
          </label>
          <label className="text-sm">
            Ends * <span className="text-foreground/60">(repeating: end of the last session)</span>
            <input name="endsAt" type="datetime-local" required defaultValue={local(values.endsAt)} className={fieldClasses} />
          </label>
        </div>
        <label className="text-sm">
          Repeats <span className="text-foreground/60">(optional, e.g. &ldquo;Every Saturday, 3:00pm to 4:00pm&rdquo;)</span>
          <input name="scheduleNote" maxLength={120} defaultValue={values.scheduleNote} className={fieldClasses} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Registration opens <span className="text-foreground/60">(empty = now)</span>
            <input name="regOpensAt" type="datetime-local" defaultValue={local(values.regOpensAt)} className={fieldClasses} />
          </label>
          <label className="text-sm">
            Registration closes <span className="text-foreground/60">(empty = when it starts)</span>
            <input name="regClosesAt" type="datetime-local" defaultValue={local(values.regClosesAt)} className={fieldClasses} />
          </label>
        </div>
      </Section>

      <Section title="Places, price and approval">
        <label className="text-sm">
          Maximum number of participants <span className="text-foreground/60">(empty = no limit)</span>
          <input name="capacity" type="number" min={1} inputMode="numeric" defaultValue={values.capacity ?? ""} className={`${fieldClasses} max-w-[10rem]`} />
        </label>
        <div className="text-sm">
          Registration fee
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill name="paid" value="no" checked={!paid} onChange={() => setPaid(false)}>
              Free
            </Pill>
            <Pill name="paid" value="yes" checked={paid} onChange={() => setPaid(true)}>
              Paid
            </Pill>
          </div>
          {paid && (
            <label className="mt-3 block">
              Price in cedis (GHS) *
              <input name="price" type="number" min={1} step="0.01" inputMode="decimal" required defaultValue={values.priceGhs || ""} className={`${fieldClasses} max-w-[10rem]`} />
              <span className="mt-1 block text-xs text-foreground/60">Paid through your Paystack. Access is given only after Paystack confirms the payment.</span>
            </label>
          )}
        </div>
        <div className="text-sm">
          Approval
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill name="approval" value="auto" checked={approval === "auto"} onChange={() => setApproval("auto")}>
              Automatic
            </Pill>
            <Pill name="approval" value="manual" checked={approval === "manual"} onChange={() => setApproval("manual")}>
              I approve each person
            </Pill>
          </div>
        </div>
      </Section>

      <Section title="Meeting platform and joining details (private)">
        <div className="flex flex-wrap gap-2 text-sm">
          {PLATFORMS.map((p) => (
            <Pill key={p} name="platform" value={p} checked={platform === p} onChange={() => setPlatform(p)}>
              {PLATFORM_LABELS[p]}
            </Pill>
          ))}
        </div>
        {platform === "other" && (
          <label className="text-sm">
            Platform name *
            <input name="platformName" required maxLength={60} defaultValue={values.platformName} placeholder="e.g. WhatsApp video call" className={fieldClasses} />
          </label>
        )}
        <label className="text-sm">
          Joining link <span className="text-foreground/60">(https://…)</span>
          <input name="joinLink" maxLength={500} defaultValue={values.joinLink} placeholder="https://zoom.us/j/…" className={fieldClasses} />
        </label>
        <label className="text-sm">
          Joining instructions <span className="text-foreground/60">(meeting ID, passcode, what to prepare…)</span>
          <textarea name="joinInstructions" rows={4} maxLength={3000} defaultValue={values.joinInstructions} className={fieldClasses} />
        </label>
        <label className="text-sm">
          Show the joining link to registered people
          <select name="linkRelease" defaultValue={values.linkRelease} className={fieldClasses}>
            {LINK_RELEASES.map((r) => (
              <option key={r} value={r}>
                {LINK_RELEASE_LABELS[r]}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-foreground/60">
            Before then, their code still works and the page tells them the date and time the link appears. It opens by itself; you don&apos;t need to do anything.
          </span>
        </label>
        <p className="rounded-xl bg-sky-50 p-3 text-xs leading-5 text-sky-950 dark:bg-white/10 dark:text-white">
          🔒 Only you can see these. Participants will see them only after entering a valid secret code. The website code does not lock the meeting itself: also
          use the platform&apos;s own controls (waiting room, passcode, host admits).
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Codes stop working this many hours after the programme ends
            <input name="codeValidHours" type="number" min={0} max={8760} defaultValue={values.codeValidHours} className={`${fieldClasses} max-w-[8rem]`} />
          </label>
          <label className="flex items-start gap-2 pt-6 text-sm">
            <input type="checkbox" name="codeSingleUse" defaultChecked={values.codeSingleUse} className="mt-1" />
            Each code shows the joining details once only
          </label>
        </div>
      </Section>

      <Section title="Show it on these pages">
        <div className="flex flex-wrap gap-2">
          {ACTIVE_BRANCHES.map((b) => {
            const on = branches.includes(b.id);
            return (
              <label
                key={b.id}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${on ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}
              >
                <input
                  type="checkbox"
                  name="branches"
                  value={b.id}
                  checked={on}
                  onChange={(e) => {
                    setBranchesTouched(true);
                    setBranches((cur) => (e.target.checked ? [...cur, b.id] : cur.filter((x) => x !== b.id)));
                  }}
                />
                {b.label}
              </label>
            );
          })}
        </div>
        <p className="text-xs text-foreground/60">
          While it is published and not yet over, its flyer and a Register button appear on these pages. It is always listed on zivarukah.com/programmes too.
        </p>
      </Section>

      <Section title="Status">
        <select name="status" defaultValue={values.status} className={fieldClasses}>
          {PROGRAMME_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROGRAMME_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Section>

      {shown && (
        <p role={shown.status === "error" ? "alert" : "status"} className={shown.status === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}>
          {shown.message}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending || uploading} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save programme"}
        </button>
      </div>
    </form>
  );
}
