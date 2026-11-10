import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readReturnPath, signinHref } from "@/lib/auth/signin-redirect.mjs";

const PROTECTED_PREFIXES = [
  "/admin",
  "/orders",
  "/payments",
  "/profile",
  "/security",
  "/onboarding",
  "/messages",
  "/settings",
  "/notifications",
  "/gigs/new",
  "/gigs/mine",
  "/seller-support",
  "/analytics",
  "/disputes",
  "/account",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        for (const item of items) request.cookies.set(item.name, item.value);
        response = NextResponse.next({ request });
        for (const item of items)
          response.cookies.set(item.name, item.value, item.options);
      },
    },
  });
  const {
    data: { user },
  } = await client.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/signup")) {
    if (user) {
      const next = readReturnPath(request.nextUrl.searchParams);
      const destination = next || "/marketplace";
      return NextResponse.redirect(new URL(destination, request.url));
    }
  } else if (!user && isProtectedPath(pathname)) {
    const returnPath = `${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(signinHref(returnPath), request.url));
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/signup",
    "/admin/:path*",
    "/orders/:path*",
    "/payments/:path*",
    "/profile/:path*",
    "/security/:path*",
    "/onboarding/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/gigs/new",
    "/gigs/mine/:path*",
    "/seller-support/:path*",
    "/analytics/:path*",
    "/disputes/:path*",
    "/account/:path*",
  ],
};
