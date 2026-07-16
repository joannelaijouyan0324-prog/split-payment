"use client";

import { supabase } from "@/lib/supabase/client";

const localUserKey = "j_split_local_user";

export type LocalUser = {
  id: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
};

type StoredLocalUser = Partial<LocalUser>;

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(localUserKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredLocalUser;
    if (!parsed.id || !parsed.displayName) return null;
    return {
      id: parsed.id,
      displayName: parsed.displayName,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
    };
  } catch {
    return null;
  }
}

export function setLocalUser(user: LocalUser) {
  window.localStorage.setItem(localUserKey, JSON.stringify(user));
}

export async function createOrUpdateLocalUser(displayName: string) {
  const cleanName = displayName.trim();
  if (!cleanName) throw new Error("Enter your name.");

  const currentUser = getLocalUser();
  const query = currentUser
    ? supabase
        .from("jsplit_users")
        .update({ display_name: cleanName, default_currency: "MYR" })
        .eq("id", currentUser.id)
    : supabase.from("jsplit_users").insert({ display_name: cleanName, default_currency: "MYR" });

  const { data, error } = await query.select("id, display_name, email").single();

  if (error) throw error;

  const nextUser = {
    id: data.id,
    displayName: data.display_name,
    email: data.email,
    phone: null,
  };

  setLocalUser(nextUser);
  return nextUser;
}
