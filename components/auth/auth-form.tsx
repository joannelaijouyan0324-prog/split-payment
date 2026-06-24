"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/client";

type AuthMode = "login" | "signup" | "forgot-password" | "update-password";

type AuthFormProps = {
  mode: AuthMode;
};

const buttonText: Record<AuthMode, string> = {
  login: "Log in",
  signup: "Create account",
  "forgot-password": "Send reset link",
  "update-password": "Update password",
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const needsPassword = mode !== "forgot-password";
  const needsConfirmPassword = mode === "signup" || mode === "update-password";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
      );
      return;
    }

    if (needsConfirmPassword && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push("/dashboard");
        router.refresh();
      }

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpError) throw signUpError;
        setMessage("Check your email to confirm your account.");
      }

      if (mode === "forgot-password") {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
          });

        if (resetError) throw resetError;
        setMessage("Password reset link sent. Check your email.");
      }

      if (mode === "update-password") {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) throw updateError;
        setMessage("Password updated. You can now continue to your dashboard.");
        setTimeout(() => router.push("/dashboard"), 800);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {mode === "signup" ? (
        <label className="block">
          <span className="text-sm font-semibold text-[#33443d]">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 h-[52px] w-full rounded-xl border border-[#d5dfd8] bg-white px-4 text-base text-[#1e2a26] outline-none transition focus:border-[#267363] focus:ring-4 focus:ring-[#267363]/10"
            placeholder="Your name"
          />
        </label>
      ) : null}

      {mode !== "update-password" ? (
        <label className="block">
          <span className="text-sm font-semibold text-[#33443d]">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            className="mt-2 h-[52px] w-full rounded-xl border border-[#d5dfd8] bg-white px-4 text-base text-[#1e2a26] outline-none transition focus:border-[#267363] focus:ring-4 focus:ring-[#267363]/10"
            placeholder="you@example.com"
          />
        </label>
      ) : null}

      {needsPassword ? (
        <label className="block">
          <span className="text-sm font-semibold text-[#33443d]">
            {mode === "update-password" ? "New password" : "Password"}
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={6}
            className="mt-2 h-[52px] w-full rounded-xl border border-[#d5dfd8] bg-white px-4 text-base text-[#1e2a26] outline-none transition focus:border-[#267363] focus:ring-4 focus:ring-[#267363]/10"
            placeholder="At least 6 characters"
          />
        </label>
      ) : null}

      {needsConfirmPassword ? (
        <label className="block">
          <span className="text-sm font-semibold text-[#33443d]">
            Confirm password
          </span>
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            required
            minLength={6}
            className="mt-2 h-[52px] w-full rounded-xl border border-[#d5dfd8] bg-white px-4 text-base text-[#1e2a26] outline-none transition focus:border-[#267363] focus:ring-4 focus:ring-[#267363]/10"
            placeholder="Repeat password"
          />
        </label>
      ) : null}

      {mode === "login" ? (
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-semibold text-[#267363] hover:text-[#173f36]"
          >
            Forgot password?
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-[#efc5c5] bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#813131]">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-[#c3e3cf] bg-[#f2fbf5] px-4 py-3 text-sm font-medium text-[#155b3a]">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="h-[52px] w-full rounded-xl bg-[#173f36] px-4 text-base font-bold text-white shadow-[0_12px_28px_rgba(23,63,54,0.22)] transition hover:bg-[#0f3028] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Working..." : buttonText[mode]}
      </button>

      <div className="text-center text-sm text-[#64736c]">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link
              href="/auth/signup"
              className="font-bold text-[#267363] hover:text-[#173f36]"
            >
              Create an account
            </Link>
          </>
        ) : null}

        {mode === "signup" || mode === "forgot-password" ? (
          <>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-bold text-[#267363] hover:text-[#173f36]"
            >
              Log in
            </Link>
          </>
        ) : null}
      </div>
    </form>
  );
}
