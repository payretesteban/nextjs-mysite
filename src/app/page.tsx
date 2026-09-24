import { PortableText } from "@portabletext/react";
import { getIndexPageData } from "@/lib/data";
import { urlFor } from "@/lib/image";
import AnimatedHeadline from "@/lib/animations";
import ContactButton from "./contact/ContactButton";
import ServicesTicker from "./services/ServicesTicker";
import { getServicesPageData } from "@/lib/services";
import { getSiteLog } from "@/lib/siteLog";
import PostList from "./_home/PostList";
import SiteLogNotes from "./_home/SiteLogNotes";

/** How many posts the homepage shows before "See all posts". */
const HOME_POST_LIMIT = 5;


export default async function IndexPage() {
  const [{ posts, postCount, profile }, { services }, siteLog] = await Promise.all([
    getIndexPageData(),
    getServicesPageData(),
    getSiteLog(),
  ]);
    
  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
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
            <AnimatedHeadline headline={profile.headline} />
            <div className="prose prose-slate">
              <PortableText value={profile.bio} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ContactButton />
              <ServicesTicker names={services.map((s) => s.shortTitle || s.title)} />
            </div>
          </div>
        </section>
      )}

      <hr className="mb-12 border-slate-200" />

      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="mb-6 text-2xl font-bold tracking-tight">Posts</h2>
        <PostList posts={posts} limit={HOME_POST_LIMIT} total={postCount} />
      </section>

      {/* overflow-x-clip keeps tossed notes from causing sideways scrolling on phones */}
      <section aria-labelledby="sitelog-heading" className="-mx-4 mt-16 overflow-x-clip px-4 pb-2">
        <h2 id="sitelog-heading" className="text-2xl font-bold tracking-tight">Site log</h2>
        <p className="mt-1 mb-8 text-sm text-slate-500 dark:text-slate-400">
          Notes from building this site, mostly the funny parts. Tap a note for the next one.
        </p>
        <SiteLogNotes entries={siteLog} moreHref="/site-log" />
      </section>
    </div>
  );
}