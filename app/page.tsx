import Link from "next/link";

export default function StartPage() {
  return (
    <main className="start-page">
      <section className="start-card">
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
