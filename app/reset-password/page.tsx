import ResetPassword from "./reset-password";
export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};
export default function ResetPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1 className="font-display text-3xl font-bold">Reset your password</h1>
        <ResetPassword />
      </div>
    </main>
  );
}
