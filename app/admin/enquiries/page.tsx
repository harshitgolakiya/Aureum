import Link from "next/link";
import { CmsShell } from "../cms-shell";
import { requireCmsRole } from "@/lib/cms/auth";
import { ENQUIRY_STATUSES, getCmsEnquiries, getCmsEnquiryComments, getCmsEnquiryCounts, type EnquiryStatus } from "@/lib/cms/enquiries";
import { addEnquiryCommentAction, retryEnquiryNotificationAction, updateEnquiryStatusAction } from "./actions";

const PAGE_SIZE = 25;
function queryValue(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
function pageHref(q: string, status: string, page: number) { const params = new URLSearchParams(); if (q) params.set("q", q); if (status !== "all") params.set("status", status); params.set("page", String(page)); return `/admin/enquiries?${params}`; }
function statusLabel(status: string) { return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireCmsRole("administrator", "editor");
  const query = await searchParams;
  const q = queryValue(query.q).trim().slice(0, 120);
  const requestedStatus = queryValue(query.status);
  const status = requestedStatus === "all" || ENQUIRY_STATUSES.includes(requestedStatus as EnquiryStatus) ? requestedStatus || "all" : "all";
  const requestedPage = Math.max(Number.parseInt(queryValue(query.page), 10) || 1, 1);
  const [{ entries, total }, counts] = await Promise.all([
    getCmsEnquiries({ q, status: status === "all" ? undefined : status, page: requestedPage, pageSize: PAGE_SIZE }),
    getCmsEnquiryCounts(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, pageCount);
  const comments = await getCmsEnquiryComments(entries.map((entry) => entry.id));
  const formatter = new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });
  const error = queryValue(query.error);
  const openId = Number.parseInt(queryValue(query.open), 10) || 0;

  return (
    <CmsShell active="enquiries" email={session.email} role={session.role} eyebrow="Contact CMS" title="Enquiries" actions={<Link className="cms-primary-action" href="/admin/enquiries/export">Export CSV</Link>}>
      <div className="cms-library cms-enquiry-library">
        {queryValue(query.updated) && <div className="cms-alert cms-alert-success">Enquiry status updated.</div>}
        {queryValue(query.commented) && <div className="cms-alert cms-alert-success">Comment added to the enquiry.</div>}
        {queryValue(query.notification) === "sent" && <div className="cms-alert cms-alert-success">Email notification sent.</div>}
        {["failed", "not_configured"].includes(queryValue(query.notification)) && <div className="cms-alert cms-alert-error">The enquiry remains stored, but the email notification could not be sent. Check the notification details and email configuration.</div>}
        {error && <div className="cms-alert cms-alert-error">{error === "not-found" ? "That enquiry no longer exists." : "The enquiry action was invalid."}</div>}

        <section className="cms-library-summary">
          <div><p className="cms-eyebrow">Website form submissions</p><h2>Follow every conversation from first contact.</h2><p>Submissions are stored here even when an email notification cannot be delivered.</p></div>
          <div className="cms-library-counts cms-enquiry-counts">
            <span><strong>{counts.new}</strong>New</span><span><strong>{counts.in_progress}</strong>In progress</span><span><strong>{counts.closed}</strong>Closed</span><span><strong>{counts.all}</strong>All</span>
          </div>
        </section>

        <form className="cms-library-filters cms-enquiry-filters" method="get">
          <label className="cms-search-field"><span>Search enquiries</span><input name="q" defaultValue={q} placeholder="Name, company, email, or interest" /></label>
          <label><span>Status</span><select name="status" defaultValue={status}><option value="all">All statuses</option>{ENQUIRY_STATUSES.map((item) => <option value={item} key={item}>{statusLabel(item)}</option>)}</select></label>
          <button type="submit">Apply filters</button>{(q || status !== "all") && <Link href="/admin/enquiries">Reset</Link>}
        </form>
        <div className="cms-library-meta"><p>Showing <strong>{entries.length}</strong> of <strong>{total}</strong> matching enquiries</p><span>Page {currentPage} of {pageCount}</span></div>

        {entries.length ? <div className="cms-enquiry-table">
          <div className="cms-enquiry-table-head"><span>Contact</span><span>Interest</span><span>Status</span><span>Notification</span><span>Received</span><span>Details</span></div>
          {entries.map((entry) => { const entryComments = comments.get(entry.id) ?? []; return <article className="cms-enquiry-row" id={`enquiry-${entry.id}`} key={entry.id}>
            <div className="cms-enquiry-contact"><strong>{entry.name}</strong><a href={`mailto:${entry.email}`}>{entry.email}</a><small>{entry.organisation} · {entry.role}</small></div>
            <span className="cms-enquiry-interest">{entry.interest}</span>
            <span className={`cms-record-status is-${entry.status}`}><i />{statusLabel(entry.status)}</span>
            <span className={`cms-notification-status is-${entry.notificationStatus}`}>{statusLabel(entry.notificationStatus)}</span>
            <time dateTime={entry.submittedAt.toISOString()}>{formatter.format(entry.submittedAt)}</time>
            <details className="cms-enquiry-details" open={openId === entry.id ? true : undefined}><summary>View{entryComments.length ? ` · ${entryComments.length}` : ""}</summary><div className="cms-enquiry-details-panel">
              <div className="cms-enquiry-detail-grid"><p><small>Phone</small>{entry.phone || "Not provided"}</p><p><small>Source</small>{entry.source || "Not provided"}</p><p><small>Enquiry ID</small>#{entry.id}</p></div>
              <div className="cms-enquiry-message"><small>Opportunity</small><p>{entry.opportunity || "No opportunity details were provided."}</p></div>
              {entry.notificationError && <p className="cms-enquiry-notification-error"><strong>Notification:</strong> {entry.notificationError}</p>}
              <div className="cms-enquiry-actions">
                <form action={updateEnquiryStatusAction}><input type="hidden" name="id" value={entry.id} /><label><span>Status</span><select name="status" defaultValue={entry.status}>{ENQUIRY_STATUSES.map((item) => <option value={item} key={item}>{statusLabel(item)}</option>)}</select></label><button type="submit">Update status</button></form>
                {entry.notificationStatus !== "sent" && <form action={retryEnquiryNotificationAction}><input type="hidden" name="id" value={entry.id} /><button type="submit">Retry email notification</button></form>}
              </div>
              <section className="cms-enquiry-comments" aria-label={`Internal comments for ${entry.name}`}>
                <div className="cms-enquiry-comments-heading"><div><small>Internal notes</small><h3>CMS comments</h3></div><span>{entryComments.length} comment{entryComments.length === 1 ? "" : "s"}</span></div>
                {entryComments.length ? <div className="cms-enquiry-comment-list">{entryComments.map((comment) => <article key={comment.id}><div><strong>{comment.authorEmail.split("@")[0]}</strong><small>{comment.authorEmail}</small></div><time dateTime={comment.createdAt.toISOString()}>{formatter.format(comment.createdAt)}</time><p>{comment.comment}</p></article>)}</div> : <p className="cms-enquiry-comments-empty">No internal comments yet.</p>}
                <form className="cms-enquiry-comment-form" action={addEnquiryCommentAction}><input type="hidden" name="id" value={entry.id} /><label><span>Add a comment as <strong>{session.email}</strong></span><textarea name="comment" rows={3} maxLength={2000} required placeholder="Add context, follow-up details, or an internal note…" /></label><button type="submit">Add comment</button></form>
              </section>
            </div></details>
          </article>; })}
        </div> : <section className="cms-library-empty"><h2>No enquiries match these filters.</h2><p>New contact-form submissions will appear here automatically.</p>{(q || status !== "all") && <Link href="/admin/enquiries">Clear all filters</Link>}</section>}

        {pageCount > 1 && <nav className="cms-pagination" aria-label="Enquiry pages">{currentPage > 1 ? <Link href={pageHref(q, status, currentPage - 1)}>← Previous</Link> : <span />}<div>{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <Link aria-current={page === currentPage ? "page" : undefined} className={page === currentPage ? "is-active" : ""} href={pageHref(q, status, page)} key={page}>{page}</Link>)}</div>{currentPage < pageCount ? <Link href={pageHref(q, status, currentPage + 1)}>Next →</Link> : <span />}</nav>}
      </div>
    </CmsShell>
  );
}
