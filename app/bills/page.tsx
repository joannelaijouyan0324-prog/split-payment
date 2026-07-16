"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { getLocalUser } from "@/lib/local-user";
import { supabase } from "@/lib/supabase/client";

type BillRow = {
  id: string;
  title: string;
  merchant_name: string | null;
  currency: string;
  total_minor: number;
  status: string;
  created_at: string;
};

function formatMinor(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

export default function BillsPage() {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [message, setMessage] = useState("Loading bills...");

  useEffect(() => {
    async function loadBills() {
      const user = getLocalUser();
      if (!user) {
        setMessage("Enter your name first to see saved bills.");
        return;
      }

      const { data, error } = await supabase
        .from("bills")
        .select("id, title, merchant_name, currency, total_minor, status, created_at")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        return;
      }

      setBills(data ?? []);
      setMessage(data?.length ? "" : "No saved bills yet.");
    }

    loadBills();
  }, []);

  return (
    <main className="app-shell">
      <AppNav active="bills" subtitle="Bill history" />
      <section className="workspace">
        <header className="topbar">
          <div>
            <Link className="back-link" href="/">
              Back
            </Link>
            <h1>Bill history</h1>
          </div>
          <Link className="link-button primary-link" href="/bills/new">
            New bill
          </Link>
        </header>
        <section className="panel">
          {message ? <div className="notice">{message}</div> : null}
          <div className="history-list">
            {bills.map((bill) => (
              <Link className="history-row" href={`/bills/new/review?billId=${bill.id}`} key={bill.id}>
                <div>
                  <strong>{bill.title}</strong>
                  <span>{bill.merchant_name || new Date(bill.created_at).toLocaleDateString("en-MY")}</span>
                </div>
                <b>{formatMinor(bill.total_minor, bill.currency)}</b>
                <span className="status-pill">{bill.status}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

