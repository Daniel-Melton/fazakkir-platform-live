import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { homePathForRole, rolesForPath } from "@/lib/auth/roles";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  const allowedRoles = rolesForPath(pathname);
  const needsAuth = pathname.startsWith("/dashboard") || allowedRoles !== null;

  // 1. حماية المسارات من غير المسجلين
  if (!user && needsAuth) {
    if (isApi) {
      return NextResponse.json({ success: false, error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 2. فحص الدور للمسارات المحمية (RBAC) — ومنع الحسابات المعطّلة
  if (user && (allowedRoles !== null || pathname === "/login")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, disabled_at")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile && !profile.disabled_at ? (profile.role as string) : null;

    if (allowedRoles !== null && (!role || !(allowedRoles as string[]).includes(role))) {
      if (isApi) {
        return NextResponse.json({ success: false, error: "ليست لديك صلاحية" }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = role ? homePathForRole(role) : "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // 3. إذا كان مسجلاً وحاول فتح صفحة الدخول، يتم توجيهه للوحة المناسبة لدوره
    if (pathname === "/login" && role) {
      const url = request.nextUrl.clone();
      url.pathname = homePathForRole(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
