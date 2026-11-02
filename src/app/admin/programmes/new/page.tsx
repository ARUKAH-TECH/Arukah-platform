import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { ProgrammeForm } from "@/features/admin/cms/ProgrammeForm";

export const metadata: Metadata = { title: "New programme" };

export default async function NewProgrammePage() {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/programmes" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All programmes
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New programme</h1>
      <div className="mt-6 max-w-2xl">
        <ProgrammeForm
          values={{
            slug: "",
            title: "",
            summary: "",
            description: "",
            category: "",
            imagePath: null,
            imageWidth: null,
            imageHeight: null,
            startsAt: null,
            endsAt: null,
            timeZone: "Africa/Accra",
            scheduleNote: "",
            regOpensAt: null,
            regClosesAt: null,
            capacity: null,
            priceGhs: 0,
            approval: "auto",
            status: "draft",
            platform: "zoom",
            platformName: "",
            codeValidHours: 24,
            codeSingleUse: false,
            joinLink: "",
            joinInstructions: "",
          }}
        />
      </div>
    </AdminShell>
  );
}
