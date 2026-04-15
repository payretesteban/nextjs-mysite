import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { PortableText } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";

interface ProfileData {
  name: string;
  headline: string;
  bio: any[]; 
  profileImage?: {
    asset: any;
    alt?: string;
  };
}

const DATA_QUERY = `{
  "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...12] {
    _id, title, slug, publishedAt
  },
  "links": *[_type == "link"] | order(category asc) {
    _id, title, url, category, icon
  },
  "profile": *[_type == "profile"][0] {...}
}`;

const builder = imageUrlBuilder(client);
function urlFor(source: any) {
  return builder.image(source);
}

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const { posts, links, profile } = await client.fetch<{
    profile: ProfileData;
    posts: SanityDocument[];
    links: SanityDocument[];
  }>(DATA_QUERY, {}, options);

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8">
      {/* --- About Me Section --- */}
      {profile && (
        <section className="mb-12 flex flex-col md:flex-row gap-8 items-start">
          {profile.profileImage && (
            <img 
              src={urlFor(profile.profileImage).width(200).height(200).url()} 
              alt={profile.profileImage.alt || profile.name}
              className="rounded-full w-32 h-32 object-cover border-4 border-slate-100"
            />
          )}
          <div>
            <h1 className="text-4xl font-bold">{profile.name}</h1>
            <p className="text-xl text-slate-600 mb-4">{profile.headline}</p>
            <div className="prose prose-slate">
              <PortableText value={profile.bio} />
            </div>
          </div>
        </section>
      )}
      {/* --- Links Section --- */}
      <section className="mb-12">
        <div className="flex gap-4">
          {links.map((link) => (
            <a
              key={link._id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              {link.title}
            </a>
          ))}
        </div>
      </section>

      <hr className="mb-12 border-slate-200" />

      {/* --- Posts Section --- */}
      <h1 className="text-4xl font-bold mb-8">Posts</h1>
      <ul className="flex flex-col gap-y-4">
        {posts.map((post) => (
          <li className="hover:underline" key={post._id}>
            <Link href={`/${post.slug.current}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-slate-500 text-sm">
                {new Date(post.publishedAt).toLocaleDateString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}