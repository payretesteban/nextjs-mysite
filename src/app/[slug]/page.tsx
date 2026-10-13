import { PortableText, type SanityDocument } from "next-sanity";
import { sanityFetch } from "@/sanity/fetch";
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

/**
 * Prebuilds a page for every post at build time; new slugs are rendered on first visit. If Sanity can't
 * be reached during the build, nothing is prebuilt (instead of failing the deploy).
 */
export async function generateStaticParams() {
  try {
    const posts = await sanityFetch<{ slug: string }[] | null>(SLUGS_QUERY);
    return (posts ?? []).map((post) => ({ slug: post.slug }));
  } catch (error) {
    console.error("[posts] Couldn't list posts from Sanity; they'll be rendered on first visit:", error);
    return [];
  }
}

/**
 * A single post page at /{slug}: optional cover image, title and body.
 * Updated when the post is published in Studio (at most an hour otherwise); an unknown slug shows the site's 404 page.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Cached and refreshed when the post is published (see @/sanity/fetch); errors show the site's error page
  const post = await sanityFetch<SanityDocument | null>(POST_QUERY, { slug });

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