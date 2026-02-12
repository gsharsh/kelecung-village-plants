import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminEmail, getPublicSupabaseEnv } from "@/lib/env";

const ADMIN_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";
const LOGIN_PATH = "/admin/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith(ADMIN_PREFIX);
  const isAdminApi = pathname.startsWith(ADMIN_API_PREFIX);

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const { url, anonKey } = getPublicSupabaseEnv();

  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPath = pathname === LOGIN_PATH;

  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isLoginPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = LOGIN_PATH;
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  if (user.email?.toLowerCase() !== getAdminEmail()) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = LOGIN_PATH;
    unauthorizedUrl.searchParams.set("reason", "forbidden");
    return NextResponse.redirect(unauthorizedUrl);
  }

  if (isLoginPath) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
