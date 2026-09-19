import Link from "next/link";
import type { CSSProperties } from "react";
import { AlertCircle, ArrowRight, BadgeCheck, BellRing, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { login } from "@/app/actions/auth";
import loginBackground from "../../../../bg.png";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; password_updated?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const passwordUpdated = params.password_updated;

  return (
    <main className="auth-page">
      <section
        className="auth-visual"
        aria-labelledby="welcome-title"
        style={{ "--auth-background": `url(${loginBackground.src})` } as CSSProperties}
      >
        <Brand inverse />
        <div className="auth-visual__copy">
          <span className="eyebrow eyebrow--light">Department recovery, made simple</span>
          <h1 id="welcome-title">Bring lost belongings back to their owners.</h1>
          <p>
            One trusted place to report an item, discover possible matches, and complete a verified claim.
          </p>
        </div>
        <div className="auth-steps" aria-label="How it works">
          <div><Search size={20} /><span><b>Search</b><small>Browse campus reports</small></span></div>
          <div><BellRing size={20} /><span><b>Match</b><small>Get relevant alerts</small></span></div>
          <div><ShieldCheck size={20} /><span><b>Recover</b><small>Verify and claim safely</small></span></div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__inner">
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to your account</h2>
          <p className="muted">Use your registered school email to continue.</p>

          {error === "invalid_credentials" && (
            <div className="info-box" style={{ background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b", margin: "1rem 0" }}>
              <AlertCircle size={20} style={{ color: "#dc2626", flexShrink: 0 }} />
              <div>
                <strong>Invalid credentials</strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#7f1d1d" }}>
                  Please register your account first via <b>Verify your school ID</b> below, or log in as Admin with:
                  <br />
                  <code>admin@example.edu</code> / <code>AdminPassword2026!</code>
                </p>
              </div>
            </div>
          )}

          {passwordUpdated && (
            <div className="info-box" style={{ background: "#dcfce7", borderColor: "#86efac", color: "#166534", margin: "1rem 0" }}>
              <ShieldCheck size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
              <span>Password updated successfully. Please sign in with your new password.</span>
            </div>
          )}

          <form className="auth-form" action={login}>
            <label>
              School email
              <input autoComplete="email" name="email" placeholder="you@school.edu.ph" required type="email" />
            </label>
            <label>
              <span className="label-row"><span>Password</span><Link href="/forgot-password">Forgot password?</Link></span>
              <input autoComplete="current-password" name="password" placeholder="Enter your password" required type="password" />
            </label>
            <button className="button button--primary button--full" type="submit">
              Sign in <ArrowRight size={18} />
            </button>
          </form>

          <div className="secure-note"><LockKeyhole size={16} /> Access is limited to verified CBEA community members.</div>
          <p className="auth-register">New here? <Link href="/register">Verify your school ID</Link></p>
          <div className="demo-links">
            <BadgeCheck size={16} /> Preview: <Link href="/portal">User portal</Link> · <Link href="/admin">Admin portal</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
