"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { getLocalUser } from "@/lib/local-user";
import { supabase } from "@/lib/supabase/client";

type SettlementRow = {
  id: string;
  bill_id: string;
  display_name: string;
  settlement_status: string;
  bill: {
    title: string;
    currency: string;
    total_minor: number;
  } | null;
};

function formatMinor(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

export default function SettlementsPage() {
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [message, setMessage] = useState("Loading settlements...");

  useEffect(() => {
    async function loadSettlements() {
      const user = getLocalUser();
      if (!user) {
        setMessage("Enter your name first to see settlement tracking.");
        return;
      }

      const { data: ownedBills, error: billError } = await supabase
        .from("bills")
        .select("id")
        .eq("owner_user_id", user.id);

      if (billError) {
        setMessage(billError.message);
        return;
      }

      const billIds = ownedBills?.map((bill) => bill.id) ?? [];
      if (!billIds.length) {
        setMessage("No unsettled participants yet.");
        return;
      }

      const { data, error } = await supabase
        .from("bill_participants")
        .select("id, bill_id, display_name, settlement_status")
        .in("bill_id", billIds)
        .in("settlement_status", ["unpaid", "pending"])
        .neq("role", "payer")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        return;
      }

      const participantRows = data ?? [];
      const participantBillIds = [...new Set(participantRows.map((row) => row.bill_id))];
      const { data: billRows, error: billRowsError } = await supabase
        .from("bills")
        .select("id, title, currency, total_minor")
        .in("id", participantBillIds);

      if (billRowsError) {
        setMessage(billRowsError.message);
        return;
      }

      const billsById = new Map((billRows ?? []).map((bill) => [bill.id, bill]));
      const normalizedRows = participantRows.map((row) => ({
        ...row,
        bill: billsById.get(row.bill_id) ?? null,
      }));

      setRows(normalizedRows);
      setMessage(data?.length ? "" : "No unsettled participants yet.");
    }

    loadSettlements();
  }, []);

  return (
    <main className="app-shell">
      <AppNav active="settlements" subtitle="Settlement tracking" />
      <section className="workspace">
        <header className="topbar">
          <div>
            <Link className="back-link" href="/">
              Back
            </Link>
            <h1>Who still owes</h1>
          </div>
        </header>
        <section className="panel">
          {message ? <div className="notice">{message}</div> : null}
          <div className="history-list">
            {rows.map((row) => (
              <article className="history-row" key={row.id}>
                <div>
                  <strong>{row.display_name}</strong>
                  <span>{row.bill?.title ?? "Untitled bill"}</span>
                </div>
                <b>{formatMinor(row.bill?.total_minor ?? 0, row.bill?.currency ?? "MYR")}</b>
                <span className="status-pill">{row.settlement_status}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
