import "server-only";
import { notFound, redirect } from "next/navigation";
import { signinHref } from "@/lib/auth/signin-redirect.mjs";
import { adminUser, authenticatedUser, serviceClient } from "./marketplace";

export async function requireAdminPage() {
  const administrator = await adminUser();
  if (administrator) return administrator;
  const user = await authenticatedUser();
  if (!user) redirect(signinHref("/admin"));
  const db = serviceClient();
  const profile = await db
    ?.from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.data?.role === "admin") redirect("/security?next=admin");
  notFound();
}
