import { PortableText, type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { urlFor } from "@/lib/image";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Animated } from "@/lib/animations";

/** The full post (including body and image) for one slug. */
const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

/** Every post slug, for prebuilding the post pages. */
const SLUGS_QUERY = `*[_type == "post"]{"slug": slug.current }`;

// Rebuild each post page at most once an hour, so edits in Sanity show up without a redeploy
export const revalidate = 3600;

/** Prebuilds a page for every post at build time; new slugs are rendered on first visit. */
export async function generateStaticParams() {
  const posts = await client.fetch<{ slug: string }[]>(SLUGS_QUERY);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

/**
 * A single post page at /{slug}: optional cover image, title and body.
 * Revalidated hourly; an unknown slug shows the site's 404 page.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // The shared client reads from Sanity's CDN in production (see @/sanity/client)
  const post = await client.fetch<SanityDocument>(POST_QUERY, { slug });

  // Unknown slug: show the site's 404 page and send a real 404 status (plus noindex) to search engines
  if (!post) notFound();

  const postImageUrl = post.image 
    ? urlFor(post.image).width(550).height(310).url() 
    : null;

  return (
    // A <div>, not <main>: the root layout already wraps every page in <main>
    <div className="container mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-8">
      <Link href="/" className="hover:underline">
        ← Back
      </Link>

      {postImageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={postImageUrl}
            alt={post.title || "Post image"}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 550px"
          />
        </div>
      )}

      <h1 className="mb-8 text-4xl font-bold">
        <Animated>{post.title}</Animated>
      </h1>

      <div className="prose dark:prose-invert">
        {Array.isArray(post.body) && (
          <PortableText value={post.body} />
        )}
      </div>
    </div>
  );
}