import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostView } from "@/components/BlogPostView";
import { blogPosts, getBlogPost } from "@/lib/blog";
import { SITE_URL, defaultOpenGraph } from "@/lib/site";

type BlogPostParams = { slug: string };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<BlogPostParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) {
    return { title: "Post not found" };
  }
  const pageUrl = `${SITE_URL}${post.path}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: post.path },
    openGraph: {
      ...defaultOpenGraph,
      type: "article",
      title: `${post.title} — EuroDigital`,
      description: post.description,
      url: pageUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — EuroDigital`,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<BlogPostParams>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  return <BlogPostView post={post} />;
}
