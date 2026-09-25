import { PortableText, type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { urlFor } from "@/lib/image";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Animated } from "@/lib/animations";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const SLUGS_QUERY = `*[_type == "post"]{"slug": slug.current }`;

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await client.fetch<{ slug: string }[]>(SLUGS_QUERY);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Fetching with the configured client (ensure useCdn: true is set in @/sanity/client)
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