import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { getIndexPageData } from "@/lib/data";
import { urlFor } from "@/lib/image";

export default async function IndexPage() {
  const { posts, links, profile } = await getIndexPageData();

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

      <hr className="mb-12 border-slate-200" />

      {/* --- Posts Section --- */}
      <h1 className="text-4xl font-bold mb-8">Posts</h1>
      <ul className="flex flex-col gap-y-4">
        {posts.map((post) => (
          <li className="hover:underline" key={post._id}>
            <Link href={`/${post.slug.current}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}