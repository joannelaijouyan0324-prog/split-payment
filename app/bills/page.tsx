"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { ToastNotice } from "@/components/toast-notice";
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
  const [billToDelete, setBillToDelete] = useState<BillRow | null>(null);

  async function deleteBill() {
    if (!billToDelete) return;
    const { error } = await supabase.from("bills").delete().eq("id", billToDelete.id);
    if (error) {
      setMessage(error.message);
      return;
    }

    setBills((current) => current.filter((item) => item.id !== billToDelete.id));
    setMessage(`${billToDelete.title} deleted.`);
    setBillToDelete(null);
  }

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
      <ToastNotice message={message} />
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
          <div className="history-list">
            {bills.map((bill) => (
              <article className="history-row-shell" key={bill.id}>
                <Link className="history-row" href={`/bills/new/review?billId=${bill.id}`}>
                  <div>
                    <strong>{bill.title}</strong>
                    <span>{bill.merchant_name || "No merchant"}</span>
                  </div>
                  <div className="history-amount">
                    <b>{formatMinor(bill.total_minor, bill.currency)}</b>
                    <span>{new Date(bill.created_at).toLocaleDateString("en-MY")}</span>
                  </div>
                  <span className="status-pill">{bill.status}</span>
                </Link>
                <button
                  type="button"
                  className="text-link remove-chip history-delete"
                  onClick={() => setBillToDelete(bill)}
                  suppressHydrationWarning
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
      {billToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-bill-title">
            <h2 id="delete-bill-title">Delete bill?</h2>
            <p>
              Delete <strong>{billToDelete.title}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={() => setBillToDelete(null)}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={deleteBill}>
                Delete
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
