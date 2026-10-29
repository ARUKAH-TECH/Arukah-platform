import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { primaryButtonClasses } from "@/features/admin/ui";
import { branchLabel } from "@/config/branches";

export const metadata: Metadata = { title: "Projects" };

const statusStyles: Record<string, string> = {
  draft: "bg-black/5 text-foreground/70 dark:bg-white/10",
  scheduled: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  published: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  archived: "bg-black/5 text-foreground/60 dark:bg-white/10",
};

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" }) : "None";
}

export default async function AdminProjectsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, slug, status, branches, publish_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <AdminShell email={admin.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Link href="/admin/projects/new" className={primaryButtonClasses}>
          New project
        </Link>
      </div>

      {!projects?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No projects yet. Create the first one.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wider text-foreground/60 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Shown on</th>
                <th className="px-4 py-3 font-medium">Publish time</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${project.id}`} className="font-medium hover:text-brand-primary-text">
                      {project.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[project.status] ?? ""}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/70">
                    {(project.branches as string[]).map(branchLabel).join(", ") || "None"}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/70">{formatDate(project.publish_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
