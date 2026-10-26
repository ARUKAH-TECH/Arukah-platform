"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { saveArticle } from "@/features/admin/cms/articleActions";
import { initialCmsFormState, slugify } from "@/features/admin/cms/shared";
import { IMAGE_PICKER_ACCEPT, resize } from "@/lib/resizeImage";
import { createClient } from "@/lib/supabase/browser";
import { ArticleBody } from "@/features/articles/ArticleBody";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

export interface ArticleFormValues {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string | null;
  imagePath: string | null;
  imageAlt: string;
  imageWidth: number | null;
  imageHeight: number | null;
  authorName: string;
  seoTitle: string;
  metaDescription: string;
  status: "draft" | "published";
  publishedAt: string | null;
}

const mediaUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;

async function uploadImage(file: File, maxEdge: number) {
  const { blob, width, height } = await resize(file, maxEdge, 0.82);
  const path = `articles/${crypto.randomUUID()}.webp`;
  const { error } = await createClient().storage.from("media").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return { path, width, height };
}

function Counter({ value, ideal, max }: { value: string; ideal: number; max: number }) {
  const n = value.length;
  return (
    <span className={`text-xs ${n > ideal ? "text-amber-700 dark:text-amber-400" : "text-foreground/50"}`}>
      {n}/{ideal} recommended{n > ideal ? " — may be cut short in Google" : ""} (max {max})
    </span>
  );
}

const toolButton =
  "min-w-[2.75rem] rounded-lg border border-black/15 bg-white px-2.5 py-2 text-sm font-semibold active:bg-black/10 dark:border-white/15 dark:bg-zinc-900";

export function ArticleForm({
  article,
  categories,
  savedMessage,
}: {
  article: ArticleFormValues;
  categories: { id: string; name: string; slug: string }[];
  savedMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(saveArticle, initialCmsFormState);
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(article.id));
  const [content, setContent] = useState(article.content);
  const [excerpt, setExcerpt] = useState(article.excerpt);
  const [seoTitle, setSeoTitle] = useState(article.seoTitle);
  const [meta, setMeta] = useState(article.metaDescription);
  const [categoryId, setCategoryId] = useState(article.categoryId ?? "");
  const [image, setImage] = useState({ path: article.imagePath, width: article.imageWidth, height: article.imageHeight });
  const [imageAlt, setImageAlt] = useState(article.imageAlt);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [panel, setPanel] = useState<"" | "link" | "image">("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [inlineAlt, setInlineAlt] = useState("");
  const [busy, setBusy] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [dirty, setDirty] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const featuredInput = useRef<HTMLInputElement>(null);
  const inlineInput = useRef<HTMLInputElement>(null);
  const isPublished = article.status === "published";
  const shown = state.status !== "idle" ? state : savedMessage ? { status: "saved", message: savedMessage } : null;
  const category = categories.find((c) => c.id === categoryId);

  function edit(next: string, cursor?: number) {
    setContent(next);
    setDirty(true);
    if (cursor !== undefined) {
      requestAnimationFrame(() => {
        const el = editor.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(cursor, cursor);
      });
    }
  }

  /** Wraps the selected words, e.g. **bold**. */
  function wrap(before: string, after: string, placeholder: string) {
    const el = editor.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = content.slice(s, e) || placeholder;
    edit(content.slice(0, s) + before + selected + after + content.slice(e), s + before.length + selected.length + after.length);
  }

  /** Puts a marker at the start of each selected line, e.g. "## " or "- ". */
  function linePrefix(kind: "h2" | "h3" | "ul" | "ol" | "quote") {
    const el = editor.current;
    if (!el) return;
    const start = content.lastIndexOf("\n", el.selectionStart - 1) + 1;
    let end = content.indexOf("\n", el.selectionEnd);
    if (end === -1) end = content.length;
    const lines = content.slice(start, end).split("\n");
    const out = lines.map((line, i) => {
      const bare = line.replace(/^(#{1,3}\s+|[-*•]\s+|\d{1,3}[.)]\s+|>\s?)/, "");
      if (kind === "h2") return `## ${bare || "Heading"}`;
      if (kind === "h3") return `### ${bare || "Sub-heading"}`;
      if (kind === "ul") return `- ${bare}`;
      if (kind === "ol") return `${i + 1}. ${bare}`;
      return `> ${bare}`;
    });
    const replaced = out.join("\n");
    edit(content.slice(0, start) + replaced + content.slice(end), start + replaced.length);
  }

  function insertBlock(block: string) {
    const el = editor.current;
    const at = el ? el.selectionEnd : content.length;
    const before = content.slice(0, at);
    const pad = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const insert = `${pad}${block}\n\n`;
    edit(before + insert + content.slice(at), at + insert.length);
  }

  function insertLink() {
    const url = linkUrl.trim();
    if (!/^(https?:\/\/[^\s]+\.[^\s]+|\/[^\s]*|mailto:[^\s@]+@[^\s@]+)$/i.test(url)) {
      setUploadError("Type a full web address starting with https:// (or a page like /books).");
      return;
    }
    setUploadError("");
    const el = editor.current;
    const s = el?.selectionStart ?? content.length;
    const e = el?.selectionEnd ?? content.length;
    const words = (linkText || content.slice(s, e) || url).replace(/[[\]]/g, "");
    const md = `[${words}](${url})`;
    edit(content.slice(0, s) + md + content.slice(e), s + md.length);
    setPanel("");
    setLinkText("");
    setLinkUrl("https://");
  }

  async function onInlineImage() {
    const file = inlineInput.current?.files?.[0];
    if (!file) return;
    setUploadError("");
    setBusy("Uploading the picture…");
    try {
      const uploaded = await uploadImage(file, 1600);
      insertBlock(`![${(inlineAlt || "Picture").replace(/[[\]]/g, "")}](${mediaUrl(uploaded.path)})`);
      setPanel("");
      setInlineAlt("");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy("");
      if (inlineInput.current) inlineInput.current.value = "";
    }
  }

  async function onFeaturedImage() {
    const file = featuredInput.current?.files?.[0];
    if (!file) return;
    setUploadError("");
    setBusy("Uploading the featured image…");
    try {
      const uploaded = await uploadImage(file, 1600);
      setImage(uploaded);
      setDirty(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy("");
      if (featuredInput.current) featuredInput.current.value = "";
    }
  }

  // The pressed button's name/value ("intent") is sent with the form.
  const submitAs = () => () => setDirty(false);

  return (
    <form
      action={formAction}
      // Pressing Enter in a small box must not publish by accident.
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") event.preventDefault();
      }}
      className="flex flex-col gap-6 pb-28"
    >
      {article.id && <input type="hidden" name="id" value={article.id} />}
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="imagePath" value={image.path ?? ""} />
      <input type="hidden" name="imageWidth" value={image.width ?? ""} />
      <input type="hidden" name="imageHeight" value={image.height ?? ""} />

      <p className="flex flex-wrap items-center gap-2 text-sm">
        Status:
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isPublished ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          }`}
        >
          {isPublished ? "Published — visitors can read it" : "Draft — hidden from visitors"}
        </span>
      </p>

      <label className="text-sm font-medium">
        Title
        <input
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setDirty(true);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
          className={`${fieldClasses} text-base`}
        />
      </label>

      <label className="text-sm font-medium">
        Web address
        <span className="mt-1 flex items-center gap-1 text-sm font-normal">
          <span className="shrink-0 text-foreground/50">/articles/</span>
          <input
            name="slug"
            maxLength={100}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
              setDirty(true);
            }}
            className={`${fieldClasses} mt-0`}
          />
        </span>
        {isPublished && <span className="mt-1 block text-xs font-normal text-amber-700 dark:text-amber-400">Changing this breaks links people already shared.</span>}
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Category
          <select name="categoryId" value={categoryId} onChange={(event) => (setCategoryId(event.target.value), setDirty(true))} className={fieldClasses}>
            <option value="">Choose…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Author
          <input name="authorName" maxLength={120} defaultValue={article.authorName} onChange={() => setDirty(true)} className={fieldClasses} />
        </label>
      </div>

      <label className="text-sm font-medium">
        Short summary (excerpt) <span className="font-normal text-foreground/50">— shown on the Articles list</span>
        <textarea
          name="excerpt"
          rows={3}
          maxLength={400}
          value={excerpt}
          onChange={(event) => (setExcerpt(event.target.value), setDirty(true))}
          className={fieldClasses}
        />
        <Counter value={excerpt} ideal={200} max={400} />
      </label>

      {/* Featured image */}
      <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <p className="text-sm font-semibold">Featured image</p>
        {image.path && (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview
          <img src={mediaUrl(image.path)} alt="" className="mt-3 aspect-[16/9] w-full rounded-xl object-cover" />
        )}
        <input ref={featuredInput} type="file" accept={IMAGE_PICKER_ACCEPT} onChange={onFeaturedImage} className="hidden" />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => featuredInput.current?.click()} disabled={Boolean(busy)} className={secondaryButtonClasses}>
            {image.path ? "Change image" : "Choose image"}
          </button>
          {image.path && (
            <button type="button" onClick={() => (setImage({ path: null, width: null, height: null }), setDirty(true))} className="text-xs underline">
              Remove
            </button>
          )}
        </div>
        <label className="mt-3 block text-sm font-medium">
          Describe the image (alt text) <span className="font-normal text-foreground/50">— for blind readers and Google</span>
          <input
            name="imageAlt"
            maxLength={300}
            value={imageAlt}
            onChange={(event) => (setImageAlt(event.target.value), setDirty(true))}
            placeholder="e.g. Students reading together in a classroom"
            className={fieldClasses}
          />
        </label>
      </div>

      {/* Editor */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Article</p>
          <div role="tablist" className="flex rounded-full border border-black/15 p-0.5 text-sm dark:border-white/15">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 ${tab === t ? "bg-brand-primary font-semibold text-brand-on-primary" : ""}`}
              >
                {t === "write" ? "✏️ Write" : "👁 Preview"}
              </button>
            ))}
          </div>
        </div>

        {tab === "write" ? (
          <>
            <div className="sticky top-14 z-10 -mx-1 mt-3 flex flex-wrap gap-1.5 bg-background/95 px-1 py-2 backdrop-blur">
              <button type="button" className={toolButton} onClick={() => linePrefix("h2")} aria-label="Heading">H2</button>
              <button type="button" className={toolButton} onClick={() => linePrefix("h3")} aria-label="Sub-heading">H3</button>
              <button type="button" className={toolButton} onClick={() => wrap("**", "**", "bold words")} aria-label="Bold">B</button>
              <button type="button" className={`${toolButton} italic`} onClick={() => wrap("*", "*", "italic words")} aria-label="Italic">I</button>
              <button type="button" className={toolButton} onClick={() => linePrefix("ul")} aria-label="Bullet list">• List</button>
              <button type="button" className={toolButton} onClick={() => linePrefix("ol")} aria-label="Numbered list">1. List</button>
              <button type="button" className={toolButton} onClick={() => linePrefix("quote")} aria-label="Quote">❝</button>
              <button type="button" className={toolButton} onClick={() => setPanel(panel === "link" ? "" : "link")} aria-label="Link" aria-expanded={panel === "link"}>🔗</button>
              <button type="button" className={toolButton} onClick={() => setPanel(panel === "image" ? "" : "image")} aria-label="Image" aria-expanded={panel === "image"}>📷</button>
            </div>

            {panel === "link" && (
              <div className="mt-2 flex flex-col gap-2 rounded-xl bg-black/5 p-3 dark:bg-white/5">
                <input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Words to show (or select words first)" className={`${fieldClasses} mt-0`} />
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} inputMode="url" placeholder="https://…" className={`${fieldClasses} mt-0`} />
                <div className="flex gap-2">
                  <button type="button" onClick={insertLink} className={primaryButtonClasses}>Add link</button>
                  <button type="button" onClick={() => setPanel("")} className={secondaryButtonClasses}>Cancel</button>
                </div>
              </div>
            )}
            {panel === "image" && (
              <div className="mt-2 flex flex-col gap-2 rounded-xl bg-black/5 p-3 dark:bg-white/5">
                <input value={inlineAlt} onChange={(e) => setInlineAlt(e.target.value)} placeholder="Describe the picture (also shown as its caption)" className={`${fieldClasses} mt-0`} />
                <input ref={inlineInput} type="file" accept={IMAGE_PICKER_ACCEPT} onChange={onInlineImage} className="hidden" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => inlineInput.current?.click()} disabled={Boolean(busy)} className={primaryButtonClasses}>
                    Choose picture
                  </button>
                  <button type="button" onClick={() => setPanel("")} className={secondaryButtonClasses}>Cancel</button>
                </div>
                <p className="text-xs text-foreground/60">It goes where your cursor is in the text.</p>
              </div>
            )}

            <textarea
              ref={editor}
              value={content}
              onChange={(event) => edit(event.target.value)}
              rows={18}
              maxLength={100000}
              placeholder={"Start writing…\n\nLeave an empty line between paragraphs."}
              className={`${fieldClasses} font-mono text-[15px] leading-7`}
            />
            <details className="mt-2 text-xs text-foreground/60">
              <summary className="cursor-pointer">Formatting help</summary>
              <ul className="mt-2 space-y-1 font-mono">
                <li>## Heading &nbsp; ### Sub-heading</li>
                <li>**bold** &nbsp; *italic*</li>
                <li>- bullet item &nbsp; 1. numbered item</li>
                <li>&gt; quote</li>
                <li>[words](https://link) — use 🔗</li>
                <li>Pictures — use 📷</li>
                <li>Empty line = new paragraph</li>
              </ul>
            </details>
          </>
        ) : (
          <div className="mt-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
            {category && <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">{category.name}</p>}
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{title || "Untitled"}</h1>
            {excerpt && <p className="mt-2 text-foreground/70">{excerpt}</p>}
            {image.path && (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview
              <img src={mediaUrl(image.path)} alt={imageAlt} className="mt-4 w-full rounded-xl" />
            )}
            <div className="mt-5">{content.trim() ? <ArticleBody content={content} /> : <p className="text-foreground/50">Nothing written yet.</p>}</div>
          </div>
        )}
        {busy && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{busy}</p>}
        {uploadError && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">
            {uploadError}
          </p>
        )}
      </div>

      {/* SEO */}
      <details className="rounded-2xl border border-black/10 p-4 dark:border-white/10" open={Boolean(article.seoTitle || article.metaDescription)}>
        <summary className="cursor-pointer text-sm font-semibold">Google &amp; sharing (SEO) — optional</summary>
        <label className="mt-4 block text-sm font-medium">
          SEO title <span className="font-normal text-foreground/50">— leave empty to use the title</span>
          <input name="seoTitle" maxLength={120} value={seoTitle} onChange={(e) => (setSeoTitle(e.target.value), setDirty(true))} className={fieldClasses} />
          <Counter value={seoTitle} ideal={60} max={120} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Meta description <span className="font-normal text-foreground/50">— leave empty to use the summary</span>
          <textarea name="metaDescription" rows={3} maxLength={300} value={meta} onChange={(e) => (setMeta(e.target.value), setDirty(true))} className={fieldClasses} />
          <Counter value={meta} ideal={160} max={300} />
        </label>
        <div className="mt-4 rounded-xl bg-black/5 p-3 text-sm dark:bg-white/5">
          <p className="text-xs text-foreground/50">How it may look on Google:</p>
          <p className="mt-1 truncate text-[#1a0dab] dark:text-blue-300">{(seoTitle || title || "Article title") + " · ZIVARUKAH"}</p>
          <p className="truncate text-xs text-green-800 dark:text-green-400">zivarukah.com/articles/{slug || "…"}</p>
          <p className="line-clamp-2 text-xs text-foreground/70">{meta || excerpt || "Your summary will appear here."}</p>
        </div>
      </details>

      {shown && (
        <p
          role={shown.status === "error" ? "alert" : "status"}
          className={`rounded-xl p-3 text-sm ${
            shown.status === "error" ? "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200" : "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
          }`}
        >
          {shown.message}
          {shown.status === "saved" && isPublished && slug && (
            <>
              {" "}
              <Link href={`/articles/${article.slug}`} target="_blank" className="font-semibold underline">
                View live ↗
              </Link>
            </>
          )}
        </p>
      )}

      {/* Publishing controls — stuck to the bottom of the screen on phones. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-background/95 p-3 backdrop-blur dark:border-white/10 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          {isPublished ? (
            <>
              <button type="submit" name="intent" value="publish" onClick={submitAs()} disabled={pending || Boolean(busy)} className={primaryButtonClasses}>
                {pending ? "Saving…" : "Update live article"}
              </button>
              <button type="submit" name="intent" value="unpublish" onClick={submitAs()} disabled={pending || Boolean(busy)} className={secondaryButtonClasses}>
                Unpublish
              </button>
            </>
          ) : (
            <>
              <button type="submit" name="intent" value="draft" onClick={submitAs()} disabled={pending || Boolean(busy)} className={secondaryButtonClasses}>
                {pending ? "Saving…" : "Save draft"}
              </button>
              <button type="submit" name="intent" value="publish" onClick={submitAs()} disabled={pending || Boolean(busy)} className={primaryButtonClasses}>
                Publish
              </button>
            </>
          )}
          {article.id && (
            <Link href={`/admin/articles/${article.id}/preview`} target="_blank" className="text-sm font-medium underline">
              Full preview{dirty ? " (save first)" : ""}
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
