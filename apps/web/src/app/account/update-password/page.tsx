import { updatePassword } from "@/app/actions/auth";
import { Brand } from "@/components/brand";

export default function UpdatePasswordPage() {
  return (
    <main className="simple-page">
      <header className="simple-header"><Brand /></header>
      <section className="registration-card">
        <span className="eyebrow">Security</span>
        <h1>Choose a new password</h1>
        <p>Use at least ten characters and avoid passwords used on other websites.</p>
        <form className="auth-form" action={updatePassword}>
          <label>New password<input name="password" type="password" minLength={10} required /></label>
          <button className="button button--primary button--full" type="submit">Update password</button>
        </form>
      </section>
    </main>
  );
}
