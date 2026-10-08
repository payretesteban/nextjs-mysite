import { PortableText } from "@portabletext/react";
import { getIndexPageData } from "@/lib/data";
import { urlFor } from "@/lib/image";
import AnimatedHeadline, { Animated } from "@/lib/animations";
import { getSiteLog } from "@/lib/siteLog";
import HomePosts from "./_home/HomePosts";
import SiteLogNotes from "./_home/SiteLogNotes";
import TheLab from "./_home/TheLab";
import HomeConsultation from "./_home/HomeConsultation";
import { getConsultation } from "@/lib/consultation";
import { getLabItems, getLabTestStats } from "@/lib/lab";

/** How many posts the homepage shows before "See all posts". */
const HOME_POST_LIMIT = 5;

/**
 * The homepage: profile and bio, the free consultation invitation (book, or explore services), The Lab
 * (the site's experiments), the latest posts and the site log notes.
 * Data loads in parallel; each loader caches for 30-60 seconds, so Sanity edits appear without a redeploy.
 */
export default async function IndexPage() {
  const [{ posts, postCount, profile }, consultation, siteLog, labItems, labTests] = await Promise.all([
    getIndexPageData(),
    getConsultation(),
    getSiteLog(),
    getLabItems(),
    getLabTestStats(),
  ]);

  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      {profile && (
        <section className="mb-12">
          {/* Small avatar beside the name, so the bio and buttons start on the same left edge as the rest of the page */}
          <div className="flex items-center gap-4">
            {profile.profileImage && (
              <img
                // WebP/AVIF when the browser supports it; loaded early because it's at the top of the page
                src={urlFor(profile.profileImage).width(144).height(144).auto("format").url()}
                alt={profile.profileImage.alt || profile.name}
                width={72}
                height={72}
                fetchPriority="high"
                decoding="async"
                className="h-16 w-16 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white sm:h-[72px] sm:w-[72px] dark:ring-slate-800"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-3xl font-bold sm:text-4xl">
                <Animated>{profile.name}</Animated>
              </h1>
              <AnimatedHeadline headline={profile.headline} className="mt-0.5 text-lg sm:text-xl" />
            </div>
          </div>
          <div className="prose prose-slate mt-5 max-w-2xl dark:prose-invert">
            <PortableText value={profile.bio} />
          </div>
          {/* Two next steps: book a free call now, or look at the services first */}
          <HomeConsultation consultation={consultation} />
        </section>
      )}

      <TheLab items={labItems} tests={labTests} />

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