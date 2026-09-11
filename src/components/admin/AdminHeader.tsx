import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/admin/SignOutButton";

interface AdminHeaderProps { title: string; description?: string; children?: ReactNode; compact?: boolean; }

export function AdminHeader({ title, description, children, compact = false }: AdminHeaderProps) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--forest-950)] text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 py-3">
          <Link href="/admin" className="flex items-center gap-3" aria-label="Kelecung content studio home">
            <span className="grid size-9 place-items-center rounded-lg bg-white/10" aria-hidden="true">✦</span>
            <span><span className="block text-sm font-bold leading-none">Kelecung</span><span className="mt-1 block text-[0.6rem] uppercase tracking-[0.18em] text-white/50">Content studio</span></span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Admin navigation">
            <Link href="/" className="hidden rounded-lg px-3 py-2 text-xs font-bold text-white/65 hover:bg-white/10 hover:text-white sm:inline-flex">View website ↗</Link>
            <SignOutButton />
          </nav>
        </div>
        <div className={`flex flex-col justify-between gap-5 ${compact ? "py-6 sm:flex-row sm:items-center" : "py-8 sm:flex-row sm:items-end sm:py-10"}`}>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--sage-300)]">Admin workspace</p><h1 className={`${compact ? "mt-2 text-3xl" : "mt-3 text-4xl sm:text-5xl"} font-semibold tracking-[-0.035em]`}>{title}</h1>{description ? <p className="mt-3 max-w-xl text-sm leading-6 text-white/58">{description}</p> : null}</div>
          {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
        </div>
      </div>
    </header>
  );
}
