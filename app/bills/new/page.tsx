"use client";

import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { createBillDraft } from "@/lib/bill-drafts";
import { getLocalUser } from "@/lib/local-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewBillStartPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!getLocalUser()) {
      router.replace("/login?next=/bills/new");
    }
  }, [router]);

  async function startBill(source: "scan" | "upload" | "manual") {
    const owner = getLocalUser();
    if (!owner) {
      router.push("/login?next=/bills/new");
      return;
    }

    if (source === "upload" && !receiptFile) {
      setError("Choose a receipt image or PDF first.");
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const bill = await createBillDraft({
        owner,
        source,
        receiptFile: source === "upload" ? receiptFile : null,
      });
      router.push(`/bills/new/review?billId=${bill.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create this bill.");
    } finally {
      setIsCreating(false);
    }
  }

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
            <button
              className="capture-action primary-capture"
              disabled={isCreating}
              type="button"
              onClick={() => startBill("scan")}
            >
              <span>Scan Receipt</span>
              <small>Open camera flow, then review extracted items.</small>
            </button>

            <label className="capture-action">
              <span>Upload File</span>
              <small>{fileName || "Choose an image or PDF receipt."}</small>
              <input
                className="hidden-file-input"
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setReceiptFile(nextFile);
                  setFileName(nextFile?.name ?? "");
                  if (error) setError("");
                }}
              />
            </label>

            <button
              className="capture-action"
              disabled={isCreating}
              type="button"
              onClick={() => startBill("manual")}
            >
              <span>Enter Manually</span>
              <small>Create items yourself if there is no receipt image.</small>
            </button>
          </div>

          {error ? <p className="field-error capture-error">{error}</p> : null}

          {fileName ? (
            <button
              className="link-button primary-link continue-link"
              disabled={isCreating}
              type="button"
              onClick={() => startBill("upload")}
            >
              {isCreating ? "Creating..." : "Continue to receipt review"}
            </button>
          ) : null}
        </section>
      </section>
    </main>
  );
}
