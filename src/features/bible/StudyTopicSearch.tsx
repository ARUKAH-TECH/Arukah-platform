// The "Study any topic" search bar (Bible guide → Studies). Plain form: works without JavaScript.
export function StudyTopicSearch({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/bible/studies/topic" className="flex flex-col gap-2 sm:flex-row">
      <input
        name="q"
        defaultValue={defaultValue}
        required
        minLength={2}
        maxLength={80}
        placeholder="Any topic, e.g. fasting, the Holy Spirit, marriage"
        aria-label="Bible study topic"
        className="min-w-0 flex-1 rounded-full border-2 border-[#e3a82a] bg-white px-5 py-3 text-base dark:bg-zinc-900"
      />
      <button type="submit" className="rounded-full bg-[#e3a82a] px-6 py-3 font-semibold text-[#14110c]">
        📚 Study it
      </button>
    </form>
  );
}
