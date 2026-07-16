import Link from "next/link";
import { AppNav } from "@/components/app-nav";

export default function SettingsPage() {
  return (
    <main className="app-shell">
      <AppNav active="settings" subtitle="Preferences" />
      <section className="workspace">
        <header className="topbar">
          <div>
            <Link className="back-link" href="/">
              Back
            </Link>
            <h1>Settings</h1>
          </div>
        </header>
        <section className="panel settings-grid">
          <label>
            Default currency
            <select defaultValue="MYR">
              <option>MYR</option>
              <option>USD</option>
              <option>SGD</option>
            </select>
          </label>
          <label>
            Language
            <select defaultValue="English">
              <option>English</option>
              <option>Malay</option>
              <option>Chinese</option>
            </select>
          </label>
          <label>
            External payment instruction
            <input defaultValue="Pay me by DuitNow or bank transfer." />
          </label>
          <div className="receipt-placeholder small">
            <strong>Payment QR placeholder</strong>
            <span>Reserve this for a payer-uploaded QR image later.</span>
          </div>
        </section>
      </section>
    </main>
  );
}
