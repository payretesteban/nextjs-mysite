import { PortableText, type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { urlFor } from "@/lib/image";
import Link from "next/link";
import Image from "next/image";

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

  if (!post) {
    return (
      <main className="container mx-auto min-h-screen max-w-3xl p-8">
        <Link href="/" className="hover:underline">
          ← Back
        </Link>
        <h1 className="mt-8 text-4xl font-bold">Post not found</h1>
      </main>
    );
  }

  const postImageUrl = post.image 
    ? urlFor(post.image).width(550).height(310).url() 
    : null;

  return (
    <main className="container mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-8">
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

      <h1 className="mb-8 text-4xl font-bold">{post.title}</h1>

      <div className="prose dark:prose-invert">
        {Array.isArray(post.body) && (
          <PortableText value={post.body} />
        )}
      </div>
    </main>
  );
}