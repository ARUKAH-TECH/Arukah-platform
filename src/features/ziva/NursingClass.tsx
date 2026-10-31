"use client";

import { useState } from "react";

// Free Saturday Zoom class for nursing students. Before the WhatsApp group
// link opens, the student fills in their school, course and the subject they
// need help with. Nothing typed here is sent to or saved by this website:
// it only becomes an introduction message the student pastes in the group.

export const NURSING_GROUP_URL = "https://chat.whatsapp.com/F0hhsg3tAqfC1kb5hqu6dC";

const COURSES = [
  "Registered General Nursing (RGN)",
  "Registered Midwifery (RM)",
  "Public Health Nursing",
  "Mental Health Nursing",
  "Nurse Assistant Clinical (NAC)",
  "Nurse Assistant Preventive (NAP)",
  "BSc Nursing",
  "Other",
];

export function NursingClass() {
  const [school, setSchool] = useState("");
  const [course, setCourse] = useState("");
  const [otherCourse, setOtherCourse] = useState("");
  const [subject, setSubject] = useState("");
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);

  const courseName = course === "Other" ? otherCourse.trim() : course;
  const ready = school.trim().length > 1 && courseName.length > 1 && subject.trim().length > 1;
  const intro = `Hello, I am joining the ZIVA free nursing class.\n\nSchool: ${school.trim()}\nCourse: ${courseName}\nSubject I need help with: ${subject.trim()}`;

  function join(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!ready) {
      e.preventDefault();
      return;
    }
    // Copy the introduction so it can be pasted in the group (the link itself can't carry it).
    try {
      navigator.clipboard.writeText(intro).then(
        () => setCopied("yes"),
        () => setCopied("no"),
      );
    } catch {
      setCopied("no");
    }
  }

  const field = "mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-[#14110c] dark:border-white/20";

  return (
    <div className="mt-6 grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold">1. Your school</span>
        <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Name of your nursing or midwifery college" maxLength={120} className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">2. Your course</span>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className={field}>
          <option value="">Choose your course</option>
          {COURSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {course === "Other" && (
          <input value={otherCourse} onChange={(e) => setOtherCourse(e.target.value)} placeholder="Type your course" maxLength={80} className={`${field} mt-2`} />
        )}
      </label>
      <label className="block">
        <span className="text-sm font-semibold">3. Subject you need help with</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Anatomy and Physiology, Pharmacology" maxLength={120} className={field} />
      </label>

      <a
        href={ready ? NURSING_GROUP_URL : "#nursing"}
        target={ready ? "_blank" : undefined}
        rel="noopener noreferrer"
        onClick={join}
        aria-disabled={!ready}
        className={`mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold ${
          ready ? "bg-[#25D366] text-black hover:opacity-90" : "cursor-not-allowed bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40"
        }`}
      >
        💬 Join the free class on WhatsApp
      </a>
      {!ready && <p className="-mt-2 text-center text-xs text-foreground/60">Fill in all three to open the WhatsApp group.</p>}

      {copied === "yes" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          ✅ Your introduction is copied. In the WhatsApp group, press and hold the message box, tap <strong>Paste</strong> and send it, so the tutor knows your school, course and subject.
        </p>
      )}
      {copied === "no" && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-white/10 dark:text-white">
          <p>In the WhatsApp group, please send this introduction:</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans">{intro}</pre>
        </div>
      )}

      <p className="text-xs leading-5 text-foreground/60">This website does not save what you type here. It only goes into the message you send in the group.</p>
    </div>
  );
}
