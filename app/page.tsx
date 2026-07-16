"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalUser } from "@/lib/local-user";

export default function StartPage() {
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    setDisplayName(getLocalUser()?.displayName ?? "");
  }, []);

  return (
    <main className="start-page">
      <section className="start-card">
        <div className="start-user-row">
          <span>{displayName ? `Hi, ${displayName}` : "Name holder not set"}</span>
          <Link className="text-link" href="/login">
            {displayName ? "Change" : "Set name"}
          </Link>
        </div>
        <div className="start-actions">
          <Link className="start-action primary-start" href="/bills/new">
            <span>New Bill</span>
            <small>Scan, upload, or enter a receipt.</small>
          </Link>
          <Link className="start-action" href="/bills">
            <span>Past Bill</span>
            <small>View drafts, unpaid bills, and settled bills.</small>
          </Link>
        </div>
      </section>
    </main>
  );
}
