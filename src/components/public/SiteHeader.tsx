import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-white/10 bg-[var(--forest-950)] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="group flex items-center gap-3" aria-label="Kelecung Village Plant Guide home">
          <span className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-lg transition-colors group-hover:bg-white/15" aria-hidden="true">✦</span>
          <span>
            <span className="block font-heading text-lg font-semibold leading-none">Kelecung</span>
            <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/60">Village plant guide</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 text-sm font-semibold sm:gap-5">
          <Link href="/#explore" className="rounded-full px-3 py-2 text-white/78 transition-colors hover:bg-white/10 hover:text-white">Explore plants</Link>
          <Link href="/admin" className="hidden rounded-full border border-white/18 px-4 py-2 text-white/78 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
