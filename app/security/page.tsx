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
          Authenticator and password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate sm:mt-4 sm:text-base">
          This is the authenticator page. Install Google Authenticator or Authy
          on your phone, tap Set up authenticator, scan the QR code, then type
          the 6-digit code. Admin tools stay locked until that code is verified,
          and only platform operator accounts can open Admin.
        </p>
        <SecuritySettings />
      </section>
    </main>
  );
}

