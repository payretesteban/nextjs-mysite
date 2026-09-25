import { PortableText } from "@portabletext/react";
import { getIndexPageData } from "@/lib/data";
import { urlFor } from "@/lib/image";
import AnimatedHeadline from "@/lib/animations";
import ContactButton from "./contact/ContactButton";
import ServicesTicker from "./services/ServicesTicker";
import { getServicesPageData } from "@/lib/services";
import { getSiteLog } from "@/lib/siteLog";
import HomePosts from "./_home/HomePosts";
import SiteLogNotes from "./_home/SiteLogNotes";

/** How many posts the homepage shows before "See all posts". */
const HOME_POST_LIMIT = 5;


/**
 * The homepage: profile, bio, contact button and services ticker, the latest posts and the site log notes.
 * Data loads in parallel; each loader caches for 30-60 seconds, so Sanity edits appear without a redeploy.
 */
export default async function IndexPage() {
  const [{ posts, postCount, profile }, { services }, siteLog] = await Promise.all([
    getIndexPageData(),
    getServicesPageData(),
    getSiteLog(),
  ]);
    
  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      {profile && (
        <section className="mb-12">
          {/* Small avatar beside the name, so the bio and buttons start on the same left edge as the rest of the page */}
          <div className="flex items-center gap-4">
            {profile.profileImage && (
              <img
                src={urlFor(profile.profileImage).width(144).height(144).url()}
                alt={profile.profileImage.alt || profile.name}
                width={72}
                height={72}
                className="h-16 w-16 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white sm:h-[72px] sm:w-[72px] dark:ring-slate-800"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-3xl font-bold sm:text-4xl">{profile.name}</h1>
              <AnimatedHeadline headline={profile.headline} className="mt-0.5 text-lg sm:text-xl" />
            </div>
          </div>
          <div className="prose prose-slate mt-5 max-w-2xl">
            <PortableText value={profile.bio} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <ContactButton />
            <ServicesTicker names={services.map((s) => s.shortTitle || s.title)} />
          </div>
        </section>
      )}

      <HomePosts posts={posts} limit={HOME_POST_LIMIT} total={postCount} />

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