import Link from "next/link";

type AppNavProps = {
  active: "dashboard" | "new" | "bills" | "settlements" | "settings";
  subtitle: string;
};

const navItems = [
  { id: "dashboard", label: "Home", href: "/" },
  { id: "bills", label: "Bills", href: "/bills" },
  { id: "new", label: "New", href: "/bills/new" },
  { id: "settlements", label: "Settle", href: "/settlements" },
  { id: "settings", label: "Profile", href: "/settings" },
] as const;

export function AppNav({ active, subtitle }: AppNavProps) {
  return (
    <>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="logo">J</div>
          <div>
            <strong>J Split</strong>
            <span>{subtitle}</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="App pages">
          {navItems.map((item) => (
            <Link
              className={active === item.id ? "active" : ""}
              href={item.href}
              key={item.id}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <strong>MVP rule</strong>
          <span>No wallet or real payment yet. This version calculates and tracks external settlement.</span>
        </div>
      </aside>

      <nav className="bottom-nav" aria-label="Mobile app pages">
        {navItems.map((item) => (
          <Link
            className={active === item.id ? "active" : ""}
            href={item.href}
            key={item.id}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
