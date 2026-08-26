import Link from "next/link";
import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getCmsAuditFilterOptions, getCmsAuditLog } from "@/lib/cms/audit";
import { getCmsTrash } from "@/lib/cms/recovery";
import { CmsShell } from "../cms-shell";
import { ConfirmedAction } from "../confirmed-action";
import { restoreTrashAction } from "./actions";

const PAGE_SIZE = 30;

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageHref(query: Record<string, string>, page: number) {
  const params = new URLSearchParams(query);
  params.set("page", String(page));
  return `/admin/recovery?${params.toString()}`;
}

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireCmsSession();
  const query = await searchParams;
  const filters = {
    user: queryValue(query.user),
    contentType: queryValue(query.type),
    record: queryValue(query.record),
    action: queryValue(query.action),
    from: queryValue(query.from),
    to: queryValue(query.to),
    page: Math.max(Number.parseInt(queryValue(query.page), 10) || 1, 1),
    pageSize: PAGE_SIZE,
  };
  const [{ entries, total }, options, trash] = await Promise.all([getCmsAuditLog(filters), getCmsAuditFilterOptions(), getCmsTrash()]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(filters.page, pageCount);
  const canRestore = cmsRoleCanEdit(session.role);
  const formatter = new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });
  const preserved = { user: filters.user, type: filters.contentType, record: filters.record, action: filters.action, from: filters.from, to: filters.to };
  const restored = queryValue(query.restored);
  const error = queryValue(query.error);

  return <CmsShell active="recovery" email={session.email} role={session.role} eyebrow="Governance" title="Audit & recovery">
    <div className="cms-recovery-page">
      {restored && <div className="cms-alert cms-alert-success">“{restored}” was restored as an unpublished record.</div>}
      {error && <div className="cms-alert cms-alert-error">The recovery action could not be completed.</div>}
      <section className="cms-library-summary">
        <div><p className="cms-eyebrow">Trash</p><h2>Recover deleted content.</h2><p>Deleted records stay here until restored. Restoration always returns content as unpublished for review.</p></div>
        <div className="cms-library-counts"><span><strong>{trash.length}</strong>Deleted records</span></div>
      </section>
      {trash.length ? <div className="cms-trash-grid">{trash.map((item) => <article key={`${item.contentType}-${item.slug}`}><div><span>{item.contentType}</span><h3>{item.label}</h3><p>/{item.slug}</p><time dateTime={item.deletedAt.toISOString()}>Deleted {formatter.format(item.deletedAt)}</time></div>{canRestore ? <ConfirmedAction action={restoreTrashAction} slug={item.slug} operation="restore" fields={{ contentType: item.contentType }} confirmMessage={`Restore ${item.label} as an unpublished ${item.contentType}?`}>Restore</ConfirmedAction> : <small>Viewer access</small>}</article>)}</div> : <section className="cms-library-empty"><h2>Trash is empty.</h2><p>Content moved to trash will appear here with a recovery action.</p></section>}

      <section className="cms-audit-heading"><div><p className="cms-eyebrow">Audit log</p><h2>Every important content change.</h2></div><p>{total} matching event{total === 1 ? "" : "s"}</p></section>
      <form className="cms-audit-filters" method="get">
        <label><span>User</span><select name="user" defaultValue={filters.user}><option value="">All users</option>{options.users.map((user) => <option value={user} key={user}>{user}</option>)}</select></label>
        <label><span>Content type</span><select name="type" defaultValue={filters.contentType}><option value="">All types</option><option value="project">Project</option><option value="insight">Insight</option><option value="page">Page</option><option value="settings">Settings</option><option value="enquiry">Enquiry</option></select></label>
        <label><span>Action</span><select name="action" defaultValue={filters.action}><option value="">All actions</option>{options.actions.map((action) => <option value={action} key={action}>{action.replaceAll("_", " ")}</option>)}</select></label>
        <label className="is-wide"><span>Record</span><input name="record" defaultValue={filters.record} placeholder="Title or slug" /></label>
        <label><span>From</span><input type="date" name="from" defaultValue={filters.from} /></label>
        <label><span>To</span><input type="date" name="to" defaultValue={filters.to} /></label>
        <button type="submit">Apply filters</button><Link href="/admin/recovery">Reset</Link>
      </form>
      {entries.length ? <div className="cms-audit-table"><div className="cms-audit-table-head"><span>When</span><span>Action</span><span>Record</span><span>User</span></div>{entries.map((entry) => <article key={entry.id}><time dateTime={entry.createdAt.toISOString()}>{formatter.format(entry.createdAt)}</time><span className={`cms-audit-action is-${entry.action}`}>{entry.action.replaceAll("_", " ")}</span><div><strong>{entry.recordLabel}</strong><small>{entry.contentType} · /{entry.contentSlug}</small></div><span>{entry.actorEmail}</span></article>)}</div> : <section className="cms-library-empty"><h2>No audit events match these filters.</h2><p>Change or clear the filters to see more activity.</p></section>}
      {pageCount > 1 && <nav className="cms-pagination" aria-label="Audit log pages"><span>{currentPage > 1 && <Link href={pageHref(preserved, currentPage - 1)}>← Previous</Link>}</span><div>Page {currentPage} of {pageCount}</div><span>{currentPage < pageCount && <Link href={pageHref(preserved, currentPage + 1)}>Next →</Link>}</span></nav>}
    </div>
  </CmsShell>;
}
