import Link from "next/link";
import { logoutAction } from "./actions";

export type CmsArea =
  | "dashboard"
  | "projects"
  | "insights"
  | "media"
  | "pages"
  | "users"
  | "recovery"
  | "settings";

const navigation: Array<{
  area: CmsArea;
  href: string;
  label: string;
  shortLabel: string;
}> = [
  { area: "dashboard", href: "/admin", label: "Dashboard", shortLabel: "01" },
  { area: "projects", href: "/admin/projects", label: "Projects", shortLabel: "02" },
  { area: "insights", href: "/admin/insights", label: "Insights", shortLabel: "03" },
  { area: "media", href: "/admin/media", label: "Media", shortLabel: "04" },
  { area: "pages", href: "/admin/pages", label: "Pages", shortLabel: "05" },
  { area: "users", href: "/admin/users", label: "Users", shortLabel: "06" },
  { area: "recovery", href: "/admin/recovery", label: "Audit & recovery", shortLabel: "07" },
  { area: "settings", href: "/admin/settings", label: "Settings", shortLabel: "08" },
];

function Navigation({ active, onMobile = false }: { active: CmsArea; onMobile?: boolean }) {
  return (
    <nav className={onMobile ? "cms-mobile-navigation" : "cms-navigation"} aria-label="CMS navigation">
      {navigation.map((item) => (
        <Link
          aria-current={active === item.area ? "page" : undefined}
          className={active === item.area ? "is-active" : ""}
          href={item.href}
          key={item.area}
        >
          <span>{item.shortLabel}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function CmsShell({
  active,
  email,
  role,
  title,
  eyebrow,
  actions,
  children,
}: {
  active: CmsArea;
  email: string;
  role?: "administrator" | "editor" | "viewer";
  title: string;
  eyebrow: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="cms-workspace">
      <aside className="cms-sidebar">
        <Link className="cms-sidebar-brand" href="/admin" aria-label="Aureum CMS dashboard">
          <strong>aureum</strong>
          <span>Content management</span>
        </Link>
        <Navigation active={active} />
        <div className="cms-sidebar-footer">
          <Link href="/?cms-preview=1" target="_blank">View website ↗</Link>
          <form action={logoutAction}><button type="submit">Sign out</button></form>
        </div>
      </aside>

      <div className="cms-workspace-main">
        <header className="cms-workspace-header">
          <details className="cms-mobile-menu">
            <summary>Menu</summary>
            <Navigation active={active} onMobile />
          </details>
          <div className="cms-workspace-heading">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="cms-workspace-account">
            <span>{email}{role ? ` · ${role}` : ""}</span>
            {actions}
          </div>
        </header>
        <main className="cms-workspace-content">{children}</main>
      </div>
    </div>
  );
}
