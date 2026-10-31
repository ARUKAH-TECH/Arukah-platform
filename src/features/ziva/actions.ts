"use server";

import { createPublicClient } from "@/lib/supabase/public";

// Records one nursing-class sign-up: school, course and subject only (no name,
// phone or device details). Checks run in the database (nursing_signup).
export async function registerNursingStudent(school: string, course: string, subject: string): Promise<{ ok: boolean; message?: string }> {
  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const { error } = await createPublicClient().rpc("nursing_signup", {
    p_school: clean(school, 120),
    p_course: clean(course, 80),
    p_subject: clean(subject, 120),
  });
  if (error) {
    console.error("[nursing-signup] failed", error.message);
    // Messages written in the database function are safe to show; anything else gets a general one.
    const friendly = /^(Please|Too many)/.test(error.message) ? error.message : "Your details couldn't be sent just now, but you can still join the group.";
    return { ok: false, message: friendly };
  }
  return { ok: true };
}
