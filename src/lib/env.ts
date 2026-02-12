function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicSupabaseEnv() {
  // Keep direct NEXT_PUBLIC_* access so Next can inline these values into client bundles.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    url,
    anonKey,
  };
}

export function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getServiceRoleKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getAdminEmail() {
  return readEnv("ADMIN_EMAIL").toLowerCase();
}

export function assertPublicEnv() {
  getPublicSupabaseEnv();
}
