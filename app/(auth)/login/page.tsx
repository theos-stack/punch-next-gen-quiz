import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string; setup?: string }> }) {
  const { message, setup } = await searchParams;
  return (
    <div className="auth-card">
      <Link className="back-link" href="/">←&nbsp; Back to home</Link>
      <h2>Welcome back</h2>
      <p className="auth-subtitle">Log in to pick up where your curiosity left off.</p>
      {message === "confirmation-failed" && <p className="form-error" role="alert">That confirmation link could not be used. Try registering again or sign in if your account is already confirmed.</p>}
      {setup === "missing" && <p className="form-error" role="alert">Authentication is not configured yet. Add the Supabase settings from <code>.env.example</code> to <code>.env.local</code> and restart the app.</p>}
      <AuthForm mode="login" />
    </div>
  );
}
