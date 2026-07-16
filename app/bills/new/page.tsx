"use client";

import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { useState } from "react";

export default function NewBillStartPage() {
  const [fileName, setFileName] = useState("");

  return (
    <main className="app-shell">
      <AppNav active="new" subtitle="Start a new split" />

      <section className="workspace capture-workspace">
        <header className="capture-topbar">
          <Link className="back-link" href="/">
            Back
          </Link>
          <h1>New Bill</h1>
        </header>

        <section className="capture-card">
          <div className="capture-actions">
            <Link className="capture-action primary-capture" href="/bills/new/review">
              <span>Scan Receipt</span>
              <small>Open camera flow, then review extracted items.</small>
            </Link>

            <label className="capture-action">
              <span>Upload File</span>
              <small>{fileName || "Choose an image or PDF receipt."}</small>
              <input
                className="hidden-file-input"
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0]?.name ?? "";
                  setFileName(nextFile);
                }}
              />
            </label>

            <Link className="capture-action" href="/bills/new/review">
              <span>Enter Manually</span>
              <small>Create items yourself if there is no receipt image.</small>
            </Link>
          </div>

          {fileName ? (
            <Link className="link-button primary-link continue-link" href="/bills/new/review">
              Continue to receipt review
            </Link>
          ) : null}
        </section>
      </section>
    </main>
  );
}
