import Link from "next/link";
import { AppNav } from "@/components/app-nav";

const settlements = [
  ["Ben", "Sushi dinner", "RM 32.10", "pending"],
  ["Chloe", "Sushi dinner", "RM 41.80", "unpaid"],
  ["Daniel", "Trip fuel", "RM 50.00", "unpaid"],
];

export default function SettlementsPage() {
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
          <div className="history-list">
            {settlements.map(([name, bill, amount, status]) => (
              <article className="history-row" key={`${name}-${bill}`}>
                <div>
                  <strong>{name}</strong>
                  <span>{bill}</span>
                </div>
                <b>{amount}</b>
                <span className="status-pill">{status}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
