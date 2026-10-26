import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, relatedArticles } from "@/db/articles";
import { ArticleView } from "@/features/articles/ArticleView";
import { JsonLd } from "@/components/seo/JsonLd";
import { plainText } from "@/lib/articleMarkup";

const SITE = (process.env.SITE_URL || "https://zivarukah.com").replace(/\/$/, "");

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

function description(article: { metaDescription: string; excerpt: string; content: string }) {
  return (article.metaDescription || article.excerpt || plainText(article.content)).slice(0, 300);
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found", robots: { index: false } };
  const title = article.seoTitle || article.title;
  const desc = description(article);
  const images = article.image ? [{ url: article.image.url, alt: article.image.alt || article.title }] : undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: `/articles/${article.slug}` },
    authors: article.authorName ? [{ name: article.authorName }] : undefined,
    openGraph: {
      type: "article",
      title,
      description: desc,
      url: `/articles/${article.slug}`,
      siteName: "ZIVARUKAH",
      locale: "en_GH",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.authorName ? [article.authorName] : undefined,
      section: article.category?.name,
      images,
    },
    twitter: { card: article.image ? "summary_large_image" : "summary", title, description: desc, images: article.image ? [article.image.url] : undefined },
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const related = await relatedArticles(article);
  const url = `${SITE}/articles/${article.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title.slice(0, 110),
          description: description(article),
          ...(article.image ? { image: [article.image.url] } : {}),
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          author: { "@type": "Person", name: article.authorName || "ZIVARUKAH" },
          publisher: { "@type": "Organization", name: "ZIVARUKAH", url: SITE },
          mainEntityOfPage: url,
          ...(article.category ? { articleSection: article.category.name } : {}),
        }}
      />
      <ArticleView article={article} related={related} shareUrl={url} />
    </>
  );
}
