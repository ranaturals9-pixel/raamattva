import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Coming-soon switch. With COMING_SOON=1 in the environment, public visitors see
 * only /coming-soon. The team opens the full site with /preview?key=<PREVIEW_KEY>
 * (sets a cookie on that browser); /preview?off ends the preview.
 * To go live: remove COMING_SOON (or set it to 0) and redeploy.
 */
const ALWAYS_OPEN = ["/coming-soon", "/preview", "/login", "/auth", "/account", "/admin", "/api", "/robots.txt", "/opengraph-image", "/icon", "/apple-icon"];

function comingSoon(request: NextRequest): NextResponse | null {
  if (process.env.COMING_SOON !== "1") return null;
  const path = request.nextUrl.pathname;
  const key = process.env.PREVIEW_KEY;

  if (path === "/preview") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const res = NextResponse.redirect(url);
    if (request.nextUrl.searchParams.has("off")) res.cookies.delete("rvp_preview");
    else if (key && request.nextUrl.searchParams.get("key") === key)
      res.cookies.set("rvp_preview", key, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 60, path: "/" });
    return res;
  }

  const bareHeaders = () => {
    const h = new Headers(request.headers);
    h.set("x-rvp-page", "coming-soon");
    return h;
  };
  if (path === "/coming-soon") return NextResponse.next({ request: { headers: bareHeaders() } });

  const previewing = Boolean(key) && request.cookies.get("rvp_preview")?.value === key;
  if (previewing || ALWAYS_OPEN.some((p) => path === p || path.startsWith(p + "/"))) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/coming-soon";
  url.search = "";
  return NextResponse.rewrite(url, { request: { headers: bareHeaders() } });
}

export async function middleware(request: NextRequest) {
  const soon = comingSoon(request);
  if (soon) return soon;
  let response = NextResponse.next({ request });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refreshes the session cookie if needed.
  const { data } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!data.user && (path.startsWith("/account") || path.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/razorpay/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
