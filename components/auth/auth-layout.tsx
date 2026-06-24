import Link from "next/link";

type AuthLayoutProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function AuthLayout({
  children,
  eyebrow,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#1e2a26] lg:px-8 lg:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-white lg:grid lg:min-h-[calc(100vh-48px)] lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden lg:rounded-[28px] lg:border lg:border-[#dbe5dd] lg:shadow-[0_28px_80px_rgba(26,42,34,0.10)]">
        <section className="order-2 bg-[#173f36] px-5 py-6 text-white lg:order-1 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="hidden lg:block">
            <Link
              href="/auth/login"
              className="text-xl font-bold tracking-tight"
            >
              Split Payment
            </Link>

            <div className="my-12 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#bfe2d4]">
                Receipt-first splitting
              </p>
              <h1 className="mt-5 text-5xl font-bold leading-tight tracking-normal">
                Snap the receipt. Let everyone claim what they bought.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#d8ebe4]">
                Build trust in the split before anyone pays outside the app.
                Perfect for dinners, trips, roommates, and shared purchases.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur lg:p-5">
            <div className="flex items-center justify-between border-b border-white/15 pb-3 lg:pb-4">
              <div>
                <p className="text-xs text-[#d8ebe4] lg:text-sm">
                  Dinner at Makan House
                </p>
                <p className="mt-1 text-xl font-bold lg:text-2xl">RM 148.60</p>
              </div>
              <span className="rounded-full bg-[#f4c678] px-3 py-1 text-xs font-bold text-[#173f36] lg:text-sm">
                4 people
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm lg:mt-4 lg:space-y-3">
              {[
                ["Jamie", "Claimed 3 items", "RM 42.40"],
                ["Sam", "Claimed 2 items", "RM 31.80"],
              ].map(([name, status, amount]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-3"
                >
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-xs text-[#cbe5dc] lg:text-sm">
                      {status}
                    </p>
                  </div>
                  <p className="font-bold">{amount}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="order-1 flex flex-1 flex-col px-5 pb-8 pt-5 sm:px-6 lg:order-2 lg:items-center lg:justify-center lg:p-10">
          <Link href="/auth/login" className="text-xl font-bold tracking-tight text-[#173f36] lg:hidden">
            Split Payment
          </Link>

          <div className="mt-9 w-full max-w-md lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#267363] lg:text-sm lg:tracking-[0.18em]">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-normal text-[#1e2a26] lg:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#64736c]">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
