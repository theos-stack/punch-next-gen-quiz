"use client";

import { useState, type FormEvent } from "react";

export function AccountProfileForm({ displayName, email }: { displayName: string; email: string }) {
  const [name, setName] = useState(displayName);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Your profile could not be updated.");
      setName(body.fullName);
      setStatus("Your display name has been saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="account-form" onSubmit={save}>
    <label htmlFor="display-name">Display name</label>
    <input id="display-name" name="fullName" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={60} autoComplete="name" required />
    <p className="field-hint">This name appears on your dashboard and the public leaderboard.</p>
    <label htmlFor="account-email">Email address</label>
    <input id="account-email" value={email} readOnly aria-readonly="true" />
    <p className="field-hint">Your email is private and cannot be changed here.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {status && <p className="form-success" role="status">{status}</p>}
    <button className="button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
  </form>;
}
