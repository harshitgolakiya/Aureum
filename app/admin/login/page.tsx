import { redirect } from "next/navigation";
import { getCmsSession, isCmsAuthConfigured } from "@/lib/cms/auth";
import { loginAction } from "../actions";

export default async function CmsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCmsSession()) redirect("/admin");
  const { error } = await searchParams;
  const configured = await isCmsAuthConfigured();

  return (
    <main className="cms-login-shell">
      <section className="cms-login-card">
        <div className="cms-mark">aureum</div>
        <p className="cms-eyebrow">Content management</p>
        <h1>Sign in to manage the site.</h1>
        {!configured && (
          <div className="cms-alert cms-alert-error">
            Configure DATABASE_URL and provide the one-time CMS admin bootstrap credentials before signing in.
          </div>
        )}
        {error && (
          <div className="cms-alert cms-alert-error">
            {error === "locked" ? "Too many failed attempts. Try again in 15 minutes." : error === "unconfigured" ? "CMS authentication is not configured." : "The email or password is incorrect."}
          </div>
        )}
        <form action={loginAction} className="cms-login-form">
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={!configured}>
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
