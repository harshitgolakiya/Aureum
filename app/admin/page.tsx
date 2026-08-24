import Link from "next/link";
import { requireCmsSession } from "@/lib/cms/auth";
import { getCmsRecentActivity, getPosts, getProjects, type CmsActivityItem } from "@/lib/cms/collections";
import { isCmsDatabaseConfigured, testCmsDatabase } from "@/lib/cms/database";
import type { InsightArticle, Project } from "@/data/site";
import { getMediaLibrary } from "@/lib/cms/media";
import { CmsShell } from "./cms-shell";

export default async function CmsAdminPage() {
  const session = await requireCmsSession();
  const configured = isCmsDatabaseConfigured();
  const connected = configured ? await testCmsDatabase() : false;
  const [projects, posts, activity, media] = await Promise.all([getProjects(true), getPosts(true), getCmsRecentActivity(), getMediaLibrary()]);
  return <CmsShell active="dashboard" email={session.email} role={session.role} eyebrow="Aureum CMS" title="Dashboard" actions={<DatabaseStatus connected={connected} configured={configured} />}><Dashboard activity={activity} connected={connected} mediaCount={media.length} posts={posts} projects={projects} /></CmsShell>;
}

function DatabaseStatus({ connected, configured }: { connected: boolean; configured: boolean }) {
  return <div className={`cms-status cms-status-compact ${connected ? "is-online" : "is-offline"}`}><i /><span><small>MySQL</small>{connected ? "Connected" : configured ? "Unavailable" : "Not configured"}</span></div>;
}

function Dashboard({ activity, connected, mediaCount, posts, projects }: { activity: CmsActivityItem[]; connected: boolean; mediaCount: number; posts: InsightArticle[]; projects: Project[] }) {
  const stats = [
    ["Published projects", projects.filter((item) => item.published).length, "/admin/projects"],
    ["Project drafts", projects.filter((item) => !item.published).length, "/admin/projects"],
    ["Published insights", posts.filter((item) => item.published).length, "/admin/insights"],
    ["Insight drafts", posts.filter((item) => !item.published).length, "/admin/insights"],
    ["Mapped media", mediaCount, "/admin/media"],
  ] as const;
  const date = new Intl.DateTimeFormat("en-AE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
  return <div className="cms-dashboard">
    {!connected && <div className="cms-alert cms-alert-error">MySQL is unavailable. Public routes are using their checked-in outage fallback and editing is disabled.</div>}
    <section className="cms-dashboard-welcome"><div><p className="cms-eyebrow">Content overview</p><h2>Your publishing workspace.</h2></div><p>Review content status, continue recent work, or move directly into a focused CMS area.</p></section>
    <section className="cms-stat-grid" aria-label="Content statistics">{stats.map(([label, count, href]) => <Link href={href} key={label}><span>{label}</span><strong>{String(count).padStart(2, "0")}</strong><small>Open area →</small></Link>)}</section>
    <div className="cms-dashboard-columns">
      <section className="cms-dashboard-panel"><div className="cms-panel-heading"><div><p className="cms-eyebrow">Activity</p><h2>Recently updated</h2></div></div><div className="cms-activity-list">{activity.length ? activity.map((item) => {
        const collection = item.kind === "Project" ? "projects" : "insights";
        const href = item.published ? `/${item.kind === "Project" ? "portfolio" : "insights"}/${item.slug}` : `/admin/${collection}?q=${encodeURIComponent(item.slug)}`;
        return <Link href={href} key={`${item.kind}-${item.slug}`}><span className={`cms-content-icon cms-content-icon-${item.kind.toLowerCase()}`}>{item.kind.slice(0, 1)}</span><div><strong>{item.title}</strong><small>{item.kind} · {item.published ? "Published" : "Not public"}</small></div><time dateTime={item.updatedAt.toISOString()}>{date.format(item.updatedAt)}</time></Link>;
      }) : <p className="cms-panel-empty">Activity appears after MySQL content is created or edited.</p>}</div></section>
      <aside className="cms-dashboard-panel cms-quick-actions"><div className="cms-panel-heading"><div><p className="cms-eyebrow">Shortcuts</p><h2>Quick actions</h2></div></div><Link href="/admin/projects/new"><span>01</span><div><strong>Create a project</strong><small>Open the project editor</small></div>→</Link><Link href="/admin/insights/new"><span>02</span><div><strong>Create an insight</strong><small>Open the structured article editor</small></div>→</Link><Link href="/admin/pages"><span>03</span><div><strong>Edit page copy</strong><small>Structured page workspace</small></div>→</Link><Link href="/" target="_blank"><span>04</span><div><strong>View website</strong><small>Open in a new tab</small></div>↗</Link></aside>
    </div>
    <section className="cms-roadmap-note"><div><p className="cms-eyebrow">Publishing source</p><h2>MySQL is the public content authority.</h2></div><p>Only published records appear on the website. Checked-in content is retained strictly as an outage fallback and never replaces an intentionally empty collection.</p><Link href="/admin/recovery">Open audit & recovery →</Link></section>
  </div>;
}
