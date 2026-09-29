import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import { Brand } from "@/components/brand";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="simple-page">
      <header className="simple-header">
        <Brand />
      </header>
      <section className="registration-card">
        <span className="eyebrow">Account recovery</span>
        <h1>Reset your password</h1>
        <p>
          Enter your registered email. If it exists, we will send password-reset
          instructions.
        </p>
        {params.sent && (
          <p role="status" className="info-box">
            If this email is registered, a reset link has been requested. Check
            your inbox and spam folder.
          </p>
        )}
        {params.error && (
          <p role="alert" className="info-box">
            We couldn't request a reset link. Please wait a moment and try
            again.
          </p>
        )}
        <form className="auth-form" action={requestPasswordReset}>
          <label>
            Email address
            <input name="email" type="email" required />
          </label>
          <button className="button button--primary button--full" type="submit">
            Send reset link
          </button>
        </form>
        <p className="auth-register">
          <Link href="/">Return to sign in</Link>
        </p>
      </section>
    </main>
  );
}
