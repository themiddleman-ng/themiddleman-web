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
      <section className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <p className="text-xs tracking-widest text-ember">ACCOUNT SECURITY</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:mt-3 sm:text-4xl">
          Protect your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate sm:mt-4 sm:text-base">
          Use an authenticator app for two-step verification. Admin access
          requires a verified code.
        </p>
        <SecuritySettings />
      </section>
    </main>
  );
}

