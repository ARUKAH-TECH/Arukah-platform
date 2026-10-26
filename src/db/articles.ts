import "server-only";
import { createPublicClient, mediaPublicUrl } from "@/lib/supabase/public";

// Public reads. The database itself only returns published articles to
// visitors (Row Level Security), so a draft can never leak through here.

export interface ArticleCategory {
  id: string;
  slug: string;
  name: string;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  category: ArticleCategory | null;
  image: { url: string; alt: string; width: number | null; height: number | null } | null;
}

export interface ArticleFull extends ArticleSummary {
  content: string;
  authorName: string;
  seoTitle: string;
  metaDescription: string;
}

const SUMMARY =
  "id, slug, title, excerpt, published_at, updated_at, featured_image_path, featured_image_alt, featured_width, featured_height, article_categories(id, slug, name)";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toSummary(row: any): ArticleSummary {
  const cat = Array.isArray(row.article_categories) ? row.article_categories[0] : row.article_categories;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    category: cat ? { id: cat.id, slug: cat.slug, name: cat.name } : null,
    image: row.featured_image_path
      ? { url: mediaPublicUrl(row.featured_image_path), alt: row.featured_image_alt ?? "", width: row.featured_width, height: row.featured_height }
      : null,
  };
}

function client() {
  try {
    return createPublicClient();
  } catch {
    return null;
  }
}

export async function getArticleCategories(): Promise<ArticleCategory[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase.from("article_categories").select("id, slug, name").order("sort_order").order("name");
  if (error) {
    console.error("[articles] categories failed", error.message);
    return [];
  }
  return data ?? [];
}

/** Letters, numbers, spaces and a few marks only — safe inside a search filter. */
export function cleanSearch(q: string) {
  return q.replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export const ARTICLES_PER_PAGE = 12;

export async function listArticles(options: { q?: string; categoryId?: string; page?: number; limit?: number } = {}) {
  const supabase = client();
  if (!supabase) return { articles: [] as ArticleSummary[], total: 0 };
  const limit = options.limit ?? ARTICLES_PER_PAGE;
  const page = Math.max(1, options.page ?? 1);
  let query = supabase
    .from("articles")
    .select(SUMMARY, { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  const q = cleanSearch(options.q ?? "");
  if (q) {
    const pattern = `%${q.replace(/\s+/g, "%")}%`;
    query = query.or(`title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern}`);
  }
  const { data, error, count } = await query;
  if (error) {
    console.error("[articles] list failed", error.message);
    return { articles: [], total: 0 };
  }
  return { articles: (data ?? []).map(toSummary), total: count ?? 0 };
}

export async function getArticle(slug: string): Promise<ArticleFull | null> {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  const supabase = client();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("articles")
    .select(`${SUMMARY}, content, author_name, seo_title, meta_description`)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.error("[articles] detail failed", error.message);
    return null;
  }
  if (!data) return null;
  return {
    ...toSummary(data),
    content: (data as any).content ?? "",
    authorName: (data as any).author_name ?? "",
    seoTitle: (data as any).seo_title ?? "",
    metaDescription: (data as any).meta_description ?? "",
  };
}

/** Same category first, then the newest others. */
export async function relatedArticles(article: ArticleSummary, count = 3): Promise<ArticleSummary[]> {
  const sameCategory = article.category
    ? (await listArticles({ categoryId: article.category.id, limit: count + 1 })).articles.filter((a) => a.id !== article.id)
    : [];
  if (sameCategory.length >= count) return sameCategory.slice(0, count);
  const latest = (await listArticles({ limit: count + 4 })).articles.filter(
    (a) => a.id !== article.id && !sameCategory.some((s) => s.id === a.id),
  );
  return [...sameCategory, ...latest].slice(0, count);
}

export async function allArticleSlugs() {
  const supabase = client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(1000);
  return data ?? [];
}
