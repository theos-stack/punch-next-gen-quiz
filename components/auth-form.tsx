"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isRegister = mode === "register";

  async function handleGoogleSignIn() {
    setError("");
    setNotice("");
    setIsGoogleSubmitting(true);

    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (oauthError) throw oauthError;
    } catch {
      setError("We couldn't start Google sign-in. Check that Google is enabled in Supabase and try again.");
      setIsGoogleSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const body = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string; requiresEmailConfirmation?: boolean };

      if (!response.ok) {
        setError(result.error ?? "We couldn't complete that request. Please try again.");
      } else if (result.requiresEmailConfirmation) {
        setNotice("Your account is ready. Check your email to confirm your address, then come back to log in.");
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch {
      setError("We couldn't reach the sign-in service. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <button className="button-social" type="button" onClick={handleGoogleSignIn} disabled={isGoogleSubmitting || isSubmitting}>
        <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
          <path fill="#4285F4" d="M48 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h13.06c-.58 2.96-2.26 5.48-4.76 7.18l7.65 5.94C44.4 37.92 48 31.8 48 24.55Z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.86l-7.65-5.94c-2.13 1.43-4.86 2.28-8.25 2.28-6.34 0-11.72-4.28-13.64-10.03l-7.9 6.09C6.4 41.5 14.6 48 24 48Z" />
          <path fill="#FBBC05" d="M10.36 28.45a14.4 14.4 0 0 1 0-8.9l-7.9-6.09a24 24 0 0 0 0 21.08l7.9-6.09Z" />
          <path fill="#EA4335" d="M24 9.55c3.54 0 6.72 1.22 9.22 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.6 0 6.4 6.5 2.46 13.46l7.9 6.09C12.28 13.8 17.66 9.55 24 9.55Z" />
        </svg>
        {isGoogleSubmitting ? "Connecting to Google…" : "Continue with Google"}
      </button>
      <div className="auth-divider" aria-hidden="true"><span>or continue with email</span></div>
      {isRegister && (
        <label className="field">
          <span>Full name</span>
          <input autoComplete="name" name="fullName" placeholder="e.g. Ada Okafor" required minLength={2} maxLength={60} />
        </label>
      )}
      <label className="field">
        <span>Email address</span>
        <input autoComplete="email" name="email" type="email" placeholder="you@example.com" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input autoComplete={isRegister ? "new-password" : "current-password"} name="password" type="password" placeholder="At least 8 characters" required minLength={8} maxLength={128} />
      </label>
      {isRegister && <p className="form-hint">Use 8–128 characters. Your password is handled by Supabase Auth.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
      <button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Log in"}
      </button>
      <p className="auth-switch">
        {isRegister ? "Already have an account? " : "New to PUNCH NextGen? "}
        <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link>
      </p>
    </form>
  );
}
