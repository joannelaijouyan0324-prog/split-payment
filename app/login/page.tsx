"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrUpdateLocalUser, getLocalUser } from "@/lib/local-user";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/");
    const currentUser = getLocalUser();
    if (currentUser) setName(currentUser.displayName);
  }, []);

  async function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await createOrUpdateLocalUser(name);
      router.push(nextPath);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save your name.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="start-page">
      <form className="start-card login-card" onSubmit={submitName}>
        <div className="login-mark">J</div>
        <div className="login-copy">
          <h1>Before we start</h1>
          <p>Use your name for this MVP. Email, phone, and payment cards are prepared for later.</p>
        </div>

        <label className="login-field">
          Your name
          <input
            autoFocus
            suppressHydrationWarning
            value={name}
            aria-invalid={error ? "true" : "false"}
            placeholder="e.g. Joanne"
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
          />
        </label>
        {error ? <p className="field-error login-error">{error}</p> : null}

        <button
          className="primary login-submit"
          type="submit"
          disabled={isSaving}
          suppressHydrationWarning
        >
          {isSaving ? "Saving..." : "Continue"}
        </button>
      </form>
    </main>
  );
}
