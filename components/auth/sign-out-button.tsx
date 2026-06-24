"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="h-11 rounded-xl border border-[#d5dfd8] bg-white px-4 text-sm font-bold text-[#33443d] transition hover:border-[#267363] hover:text-[#173f36]"
    >
      Log out
    </button>
  );
}
