import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--forest-950)] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr] lg:px-10">
        <div>
          <p className="font-heading text-2xl font-semibold">Rooted in village knowledge.</p>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/62">A growing field guide to the useful, beautiful, and storied plants found around Kelecung Village.</p>
        </div>
        <div className="flex items-end gap-5 text-sm font-semibold text-white/65 md:justify-end">
          <Link href="/#explore" className="hover:text-white">Browse plants</Link>
          <Link href="/admin" className="hover:text-white">Admin</Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/45">Kelecung Village Plant Guide</div>
    </footer>
  );
}
