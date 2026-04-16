import { getIndexPageData } from "@/lib/data";


export default async function Header() {
 
  const { links } = await getIndexPageData();

  return (
    <header className="container mx-auto max-w-3xl p-8 pb-0">
      <nav className="flex gap-4 border-b border-slate-200 pb-8">
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
      </nav>
    </header>
  );
}