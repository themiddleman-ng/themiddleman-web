import SiteHeader from "@/components/SiteHeader";
import SecuritySettings from "./security-settings";
export const metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};
export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-5 py-12">
        <p className="text-xs tracking-widest text-ember">ACCOUNT SECURITY</p>
        <h1 className="mt-3 font-display text-4xl font-bold">
          Protect your account
        </h1>
        <p className="mt-4 text-slate">
          Use an authenticator app for two-step verification. Admin access
          requires a verified code.
        </p>
        <SecuritySettings />
      </section>
    </main>
  );
}
