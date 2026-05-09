import { PortableText, type SanityDocument } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";

const POST_QUERY = `
  *[_type == "post" && slug.current == $slug][0]
`;

const SLUGS_QUERY = `
  *[_type == "post"]{
    "slug": slug.current
  }
`;

export const revalidate = 3600;

export async function generateStaticParams() {
  return client.fetch<{ slug: string }[]>(
    SLUGS_QUERY
  );
}

const { projectId, dataset } = client.config();

const builder =
  projectId && dataset
    ? createImageUrlBuilder({
        projectId,
        dataset,
      })
    : null;

const urlFor = (source: SanityImageSource) =>
  builder?.image(source);

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await client.fetch<SanityDocument>(
    POST_QUERY,
    { slug }
  );

  if (!post) {
    return (
      <main className="container mx-auto min-h-screen max-w-3xl p-8">
        <Link href="/" className="hover:underline">
          ← Back
        </Link>

        <h1 className="mt-8 text-4xl font-bold">
          Post not found
        </h1>
      </main>
    );
  }

  const postImageUrl = post.image
    ? urlFor(post.image)
        ?.width(550)
        .height(310)
        .url()
    : null;

  return (
    <main className="container mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-8">
      <Link href="/" className="hover:underline">
        ← Back
      </Link>

      {postImageUrl && (
        <img
          src={postImageUrl}
          alt={post.title || "Post image"}
          width={550}
          height={310}
          className="aspect-video rounded-xl"
        />
      )}

      <h1 className="mb-8 text-4xl font-bold">
        {post.title}
      </h1>

      <div className="prose">
        {Array.isArray(post.body) && (
          <PortableText value={post.body} />
        )}
      </div>
    </main>
  );
}