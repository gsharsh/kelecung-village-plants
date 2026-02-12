import { getAdminEmail } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function assertAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminAuthError("Unauthorized", 401);
  }

  const adminEmail = getAdminEmail();
  if (user.email?.toLowerCase() !== adminEmail) {
    throw new AdminAuthError("Forbidden", 403);
  }

  return user;
}
