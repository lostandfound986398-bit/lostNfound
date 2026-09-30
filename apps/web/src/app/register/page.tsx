import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  BadgeInfo,
  BriefcaseBusiness,
  GraduationCap,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { register } from "@/app/actions/register";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const success = params.success;

  return (
    <main className="simple-page">
      <header className="simple-header">
        <Brand />
      </header>
      <section className="registration-card">
        <span className="eyebrow">Account verification</span>
        <h1>Join your campus community</h1>
        <p>
          Students can create an account directly with their School ID. Faculty
          and Staff details must match the official CBEA directory.
        </p>

        {success === "check_email" && (
          <div
            className="info-box"
            style={{
              background: "#dcfce7",
              borderColor: "#86efac",
              color: "#166534",
              margin: "1rem 0",
            }}
          >
            <BadgeCheck size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
            <div>
              <strong>Account verified and created successfully!</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.85rem",
                  color: "#14532d",
                }}
              >
                Your account is ready. You can now{" "}
                <Link
                  href="/"
                  style={{ fontWeight: 600, textDecoration: "underline" }}
                >
                  Sign in here
                </Link>{" "}
                with your email and password.
              </p>
            </div>
          </div>
        )}

        {error === "connection_error" && (
          <p role="alert" className="info-box">
            We couldn't connect to registration. Please try again shortly.
          </p>
        )}
        {error === "already_registered" && (
          <p role="alert" className="info-box">
            An account may already exist for these details, or account creation
            could not be completed. Try signing in or resetting your password.
            Contact the custody office if you still need help.
          </p>
        )}
        {error === "verification_failed" && (
          <div
            className="info-box"
            style={{
              background: "#fee2e2",
              borderColor: "#fca5a5",
              color: "#991b1b",
              margin: "1rem 0",
            }}
          >
            <AlertCircle
              size={20}
              style={{ color: "#dc2626", flexShrink: 0 }}
            />
            <div>
              <strong>Verification failed</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.85rem",
                  color: "#7f1d1d",
                }}
              >
                This School ID may already belong to a different account, or the
                Faculty/Staff details do not match an active directory record.
              </p>
            </div>
          </div>
        )}

        <div className="role-picker" aria-hidden="true">
          <span className="role-option">
            <GraduationCap size={22} />
            Student
          </span>
          <span className="role-option">
            <Users size={22} />
            Faculty
          </span>
          <span className="role-option">
            <BriefcaseBusiness size={22} />
            Staff
          </span>
        </div>

        <form action={register}>
          <div className="field-grid">
            <label>
              Role
              <select className="form-control" name="role" required>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="STAFF">Staff</option>
              </select>
            </label>
            <label>
              School ID
              <input
                className="form-control"
                name="schoolId"
                placeholder="e.g. TEST-STU-0001"
                required
              />
            </label>
            <label>
              Full name
              <input
                className="form-control"
                name="fullName"
                placeholder="e.g. Alex Rivera"
                required
              />
            </label>
            <label>
              Email
              <input
                className="form-control"
                name="email"
                placeholder="e.g. alex.rivera@example.edu"
                required
                type="email"
              />
            </label>
            <label>
              Password
              <input
                className="form-control"
                minLength={10}
                name="password"
                placeholder="Min 10 characters"
                required
                type="password"
              />
            </label>
          </div>

          <div className="info-box" style={{ marginTop: "1rem" }}>
            <BadgeInfo size={20} />
            <span>
              Student accounts do not need a preloaded master-list record.
              Existing School IDs and email addresses cannot be reused.
            </span>
          </div>

          <button className="button button--primary button--full" type="submit">
            Verify and create account
          </button>
        </form>
        <p className="auth-register">
          Already registered? <Link href="/">Return to sign in</Link>
        </p>
      </section>
    </main>
  );
}
