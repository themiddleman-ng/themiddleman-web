import "server-only";
import { notFound, redirect } from "next/navigation";
import { adminUser, authenticatedUser, serviceClient } from "./marketplace";

export async function requireAdminPage() {
  const administrator = await adminUser();
  if (administrator) return administrator;
  const user = await authenticatedUser();
  if (!user) redirect("/signup?mode=signin");
  const db = serviceClient();
  const profile = await db
    ?.from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.data?.role === "admin") redirect("/security?next=admin");
  notFound();
}
