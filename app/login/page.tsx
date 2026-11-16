import { redirect } from "next/navigation";
import { readReturnPath, signinHref } from "@/lib/auth/signin-redirect.mjs";

// Old links and muscle memory hit /login. Sign-in lives on /signup?mode=signin.
export default async function LoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  redirect(signinHref(readReturnPath(query) || ""));
}
