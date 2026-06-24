import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-[#f4f7f5] px-4 py-6 text-[#1e2a26] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-[#efc5c5] bg-[#fff0f0] px-5 py-4 text-sm font-medium text-[#813131]">
            Supabase is not configured yet. Copy .env.local.example to
            .env.local and add your project URL and publishable key.
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5] px-4 py-5 text-[#1e2a26] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl border border-[#dbe5dd] bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#267363]">
              Dashboard
            </p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-normal sm:text-3xl">
              Welcome to Split Payment
            </h1>
            <p className="mt-2 break-all text-sm text-[#64736c]">
              Signed in as {user.email}
            </p>
          </div>
          <div className="mt-5 sm:mt-6">
            <button className="h-[52px] w-full rounded-xl bg-[#173f36] px-4 text-base font-bold text-white shadow-[0_12px_28px_rgba(23,63,54,0.18)] transition hover:bg-[#0f3028] sm:w-auto sm:min-w-48">
              Start new split
            </button>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-3">
          {[
            [
              "Create receipt split",
              "Start from a receipt photo or manual entry.",
            ],
            ["Invite participants", "Share a link so people can claim items."],
            ["Track settlements", "Mark external repayments as paid."],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-[#dbe5dd] bg-white p-4 shadow-sm sm:p-5"
            >
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#64736c]">
                {description}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-5 flex justify-center sm:justify-end">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
