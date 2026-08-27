"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50">{isSigningOut ? "Signing out…" : "Sign out"}</button>;
}
