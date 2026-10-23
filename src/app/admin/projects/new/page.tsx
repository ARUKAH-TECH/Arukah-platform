import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { ProjectForm } from "@/features/admin/cms/ProjectForm";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/projects" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New project</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Save it as a draft first; you can attach photos and videos once it exists.
      </p>
      <div className="mt-8 max-w-3xl">
        <ProjectForm
          project={{
            title: "",
            slug: "",
            summary: "",
            body: "",
            status: "draft",
            publishAt: null,
            unpublishAt: null,
            branches: [],
            coverMediaId: null,
          }}
          images={[]}
        />
      </div>
    </AdminShell>
  );
}
