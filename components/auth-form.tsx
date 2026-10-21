"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isRegister = mode === "register";

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
