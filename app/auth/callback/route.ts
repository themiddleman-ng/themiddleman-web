import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get("code");
  const dest =
    url.searchParams.get("next") === "/reset-password"
      ? "/reset-password?recovery=true"
      : "/security";
  if (
    code &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const store = await cookies();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => store.getAll(),
          setAll: (items) => {
            for (const item of items)
              store.set(item.name, item.value, item.options);
          },
        },
      },
    );
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(dest, url.origin));
  }
  return NextResponse.redirect(
    new URL("/reset-password?error=expired", url.origin),
  );
}
