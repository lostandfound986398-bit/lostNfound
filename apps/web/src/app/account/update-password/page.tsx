import { updatePassword } from "@/app/actions/auth";
import { Brand } from "@/components/brand";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="simple-page">
      <header className="simple-header">
        <Brand />
      </header>
      <section className="registration-card">
        <span className="eyebrow">Security</span>
        <h1>Choose a new password</h1>
        <p>
          Use at least ten characters and avoid passwords used on other
          websites.
        </p>
        {params.error && (
          <p role="alert" className="info-box">
            Your password could not be updated. Try a different password or
            request a new reset link if this one has expired.
          </p>
        )}
        <form className="auth-form" action={updatePassword}>
          <label>
            New password
            <input name="password" type="password" minLength={10} required />
          </label>
          <button className="button button--primary button--full" type="submit">
            Update password
          </button>
        </form>
      </section>
    </main>
  );
}
