"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  return <Suspense fallback={<LoginShell />}><AdminLoginContent /></Suspense>;
}

function AdminLoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/admin";
  const forbidden = searchParams.get("reason") === "forbidden";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError("The email or password is incorrect. Please try again."); return; }
      router.push(next);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in right now. Please try again.");
    } finally { setIsSubmitting(false); }
  }

  return (
    <LoginShell>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {forbidden ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">This account does not have access to the content studio.</div> : null}
        <div><label htmlFor="email" className="field-label">Admin email</label><input id="email" type="email" autoComplete="email" required className="text-input min-h-12" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div>
        <div><label htmlFor="password" className="field-label">Password</label><input id="password" type="password" autoComplete="current-password" required className="text-input min-h-12" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div>
        {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-[var(--danger)]">{error}</p> : null}
        <button type="submit" disabled={isSubmitting} className="primary-btn min-h-12 w-full">{isSubmitting ? "Signing in…" : "Sign in to the studio"}</button>
      </form>
    </LoginShell>
  );
}

function LoginShell({ children }: { children?: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-[var(--cream-50)] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[var(--forest-950)] lg:block">
        <Image src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=85" alt="Lush village plants" fill priority sizes="55vw" className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-950)] via-[var(--forest-950)]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white xl:p-16"><p className="eyebrow !text-[var(--sage-300)]">Kelecung Village</p><h1 className="mt-5 max-w-xl text-5xl font-semibold tracking-[-0.04em] xl:text-6xl">Keep the village story growing.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/65">Manage the plant collection, preserve local knowledge, and publish beautiful stories for every visitor.</p></div>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--forest-800)] hover:text-[var(--forest-700)]">← Back to the plant guide</Link>
          <div className="mt-10"><span className="grid size-12 place-items-center rounded-xl bg-[var(--forest-900)] text-xl text-white" aria-hidden="true">✦</span><p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[var(--moss-500)]">Content studio</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Welcome back</h1><p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">Sign in to manage the Kelecung Village plant collection.</p></div>
          {children}
          <p className="mt-8 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--ink-700)]">Access is limited to authorised village administrators.</p>
        </div>
      </section>
    </main>
  );
}
