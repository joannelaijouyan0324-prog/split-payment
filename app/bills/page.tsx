import Link from "next/link";
import { AppNav } from "@/components/app-nav";

const bills = [
  ["Sushi dinner", "Jalan Bistro", "RM 128.40", "3 unpaid"],
  ["Weekend groceries", "Village Grocer", "RM 82.10", "settled"],
  ["Trip fuel", "Shell", "RM 150.00", "draft"],
];

export default function BillsPage() {
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
          <Link className="link-button primary-link" href="/bills/new">New bill</Link>
        </header>
        <section className="panel">
          <div className="history-list">
            {bills.map(([title, merchant, amount, status]) => (
              <Link className="history-row" href="/bills/new/review" key={title}>
                <div>
                  <strong>{title}</strong>
                  <span>{merchant}</span>
                </div>
                <b>{amount}</b>
                <span className="status-pill">{status}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
