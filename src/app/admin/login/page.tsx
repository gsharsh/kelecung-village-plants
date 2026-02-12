"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to start sign in. Check your environment configuration.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LoginShell>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="text-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="text-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm font-medium text-[var(--danger)]">{error}</p> : null}

        <button type="submit" disabled={isSubmitting} className="primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </LoginShell>
  );
}

function LoginShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card-surface w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold text-[var(--text-900)]">Admin Login</h1>
        <p className="mt-2 text-sm text-[var(--text-700)]">Sign in with the shared Kelecung&apos;s Village admin account.</p>
        {children}
      </div>
    </div>
  );
}
