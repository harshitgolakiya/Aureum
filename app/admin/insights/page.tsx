import Image from "next/image";
import Link from "next/link";
import { postLibraryAction } from "../actions";
import { CmsShell } from "../cms-shell";
import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getCmsPostLibrary, type CmsPostListItem } from "@/lib/cms/collections";
import { ConfirmedAction } from "../confirmed-action";

const PAGE_SIZE = 8;
const statusValues = ["all", "published", "draft", "scheduled", "unpublished", "archived"] as const;
const sortValues = ["updated", "title", "order", "publication"] as const;

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function insightStatus(insight: CmsPostListItem) {
  return insight.workflowStatus[0].toUpperCase() + insight.workflowStatus.slice(1);
}

function publicationTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function pageHref(query: Record<string, string>, page: number) {
  const params = new URLSearchParams(query);
  params.set("page", String(page));
  return `/admin/insights?${params.toString()}`;
}

export default async function InsightsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireCmsSession();
  const [insights, query] = await Promise.all([getCmsPostLibrary(), searchParams]);
  const canEdit = cmsRoleCanEdit(session.role);
  const search = queryValue(query.q).trim();
  const requestedStatus = queryValue(query.status).toLowerCase();
  const status = statusValues.includes(requestedStatus as (typeof statusValues)[number]) ? requestedStatus : "all";
  const requestedSort = queryValue(query.sort).toLowerCase();
  const sort = sortValues.includes(requestedSort as (typeof sortValues)[number]) ? requestedSort : "updated";
  const category = queryValue(query.category);
  const categories = [...new Set(insights.map((insight) => insight.category))].sort((a, b) => a.localeCompare(b));
  const searchLower = search.toLowerCase();

  const filtered = insights
    .filter((insight) => !searchLower || [insight.title, insight.slug, insight.category, insight.author].some((value) => value.toLowerCase().includes(searchLower)))
    .filter((insight) => !category || insight.category === category)
    .filter((insight) => status === "all" || insightStatus(insight).toLowerCase() === status)
    .sort((left, right) => {
      if (sort === "title") return left.title.localeCompare(right.title);
      if (sort === "order") return left.sortOrder - right.sortOrder || left.title.localeCompare(right.title);
      if (sort === "publication") return publicationTime(right.date) - publicationTime(left.date);
      return right.updatedAt.getTime() - left.updatedAt.getTime();
    });

  const requestedPage = Number.parseInt(queryValue(query.page), 10) || 1;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(requestedPage, 1), pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const preservedQuery = { q: search, status, category, sort };
  const formatter = new Intl.DateTimeFormat("en-AE", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dubai" });
  const updated = queryValue(query.updated);
  const created = queryValue(query.created);
  const operation = queryValue(query.operation);
  const error = queryValue(query.error);

  return (
    <CmsShell active="insights" email={session.email} eyebrow="Editorial CMS" title="Insights" actions={canEdit ? <Link className="cms-primary-action" href="/admin/insights/new">New insight</Link> : undefined}>
      <div className="cms-library cms-insight-library">
        {updated && <div className="cms-alert cms-alert-success">Insight “{updated}” was {operation === "feature" ? "set as the featured story" : operation === "unfeature" ? "removed from the featured position" : "updated successfully"}.</div>}
        {created && <div className="cms-alert cms-alert-success">Draft copy “{created}” was created.</div>}
        {error && <div className="cms-alert cms-alert-error">{error === "feature" ? "Only a published, active insight can be featured." : error === "incomplete" ? "This insight is missing required publishing content. Open the editor and complete the highlighted fields." : "The insight action could not be completed. Please try again."}</div>}

        <section className="cms-library-summary">
          <div><p className="cms-eyebrow">Insight library</p><h2>Manage Aureum’s editorial perspective.</h2></div>
          <div className="cms-library-counts">
            {(["Published", "Draft", "Scheduled", "Unpublished", "Archived"] as const).map((label) => <span key={label}><strong>{insights.filter((item) => insightStatus(item) === label).length}</strong>{label === "Draft" ? "Drafts" : label}</span>)}
          </div>
        </section>

        <form className="cms-library-filters" method="get">
          <label className="cms-search-field"><span>Search insights</span><input name="q" defaultValue={search} placeholder="Title, author, category, or slug" /></label>
          <label><span>Status</span><select name="status" defaultValue={status}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option></select></label>
          <label><span>Category</span><select name="category" defaultValue={category}><option value="">All categories</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <label><span>Sort by</span><select name="sort" defaultValue={sort}><option value="updated">Recently updated</option><option value="title">Article title</option><option value="order">Display order</option><option value="publication">Publication date</option></select></label>
          <button type="submit">Apply filters</button>
          {(search || status !== "all" || category || sort !== "updated") && <Link href="/admin/insights">Reset</Link>}
        </form>

        <div className="cms-library-meta"><p>Showing <strong>{visible.length}</strong> of <strong>{filtered.length}</strong> matching insights</p><span>Page {currentPage} of {pageCount}</span></div>

        {visible.length ? (
          <div className="cms-insight-table">
            <div className="cms-insight-table-head"><span>Insight</span><span>Status</span><span>Category / Author</span><span>Featured</span><span>Updated</span><span><span className="sr-only">Actions</span></span></div>
            {visible.map((insight) => {
              const state = insightStatus(insight);
              return (
                <article className="cms-insight-row" key={insight.slug}>
                  <div className="cms-project-identity"><div className="cms-project-thumb"><Image src={insight.coverImage} alt="" fill sizes="72px" /></div><div><strong>{insight.title}</strong><small>/{insight.slug}</small></div></div>
                  <div><span className={`cms-record-status is-${state.toLowerCase()}`}><i />{state}</span>{state === "Scheduled" && <small className="cms-schedule-date">{formatter.format(new Date(insight.scheduledAt))}</small>}</div>
                  <div className="cms-project-context"><strong>{insight.category}</strong><small>{insight.author}</small></div>
                  <div className={`cms-featured-marker${insight.featured ? " is-active" : ""}`}>{insight.featured ? "Featured" : "—"}</div>
                  <time dateTime={insight.updatedAt.toISOString()}>{formatter.format(insight.updatedAt)}</time>
                  <details className="cms-row-actions"><summary aria-label={`Actions for ${insight.title}`}>•••</summary><div>
                    {canEdit && !insight.archived && <Link href={`/admin/insights/${insight.slug}`}>Edit insight</Link>}
                    <Link href={`/admin/insights/${insight.slug}/revisions`}>Revision history</Link>
                    {!insight.archived && <Link href={`/admin/insights/${insight.slug}/preview`} target="_blank">Preview ↗</Link>}
                    {canEdit && !insight.archived && <LibraryAction slug={insight.slug} operation="duplicate">Duplicate as draft</LibraryAction>}
                    {canEdit && insight.workflowStatus === "scheduled" && <LibraryAction slug={insight.slug} operation="cancel_schedule">Cancel schedule</LibraryAction>}
                    {canEdit && !insight.archived && insight.workflowStatus !== "scheduled" && <LibraryAction slug={insight.slug} operation={insight.published ? "unpublish" : "publish"}>{insight.published ? "Unpublish insight" : "Publish insight"}</LibraryAction>}
                    {canEdit && insight.published && !insight.archived && <LibraryAction slug={insight.slug} operation={insight.featured ? "unfeature" : "feature"}>{insight.featured ? "Remove featured status" : "Set as featured story"}</LibraryAction>}
                    {canEdit && <LibraryAction slug={insight.slug} operation={insight.archived ? "restore" : "archive"}>{insight.archived ? "Restore insight" : "Archive insight"}</LibraryAction>}
                    {canEdit && <LibraryAction slug={insight.slug} operation="trash">Move to trash</LibraryAction>}
                  </div></details>
                </article>
              );
            })}
          </div>
        ) : <section className="cms-library-empty"><h2>No insights match these filters.</h2><p>Try clearing the search or changing the selected status and category.</p><Link href="/admin/insights">Clear all filters</Link></section>}

        {pageCount > 1 && <nav className="cms-pagination" aria-label="Insight library pages">
          {currentPage > 1 ? <Link href={pageHref(preservedQuery, currentPage - 1)}>← Previous</Link> : <span />}
          <div>{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <Link aria-current={page === currentPage ? "page" : undefined} className={page === currentPage ? "is-active" : ""} href={pageHref(preservedQuery, page)} key={page}>{page}</Link>)}</div>
          {currentPage < pageCount ? <Link href={pageHref(preservedQuery, currentPage + 1)}>Next →</Link> : <span />}
        </nav>}
      </div>
    </CmsShell>
  );
}

function LibraryAction({ slug, operation, children }: { slug: string; operation: "publish" | "unpublish" | "archive" | "restore" | "duplicate" | "feature" | "unfeature" | "cancel_schedule" | "trash"; children: React.ReactNode }) {
  return <ConfirmedAction action={postLibraryAction} slug={slug} operation={operation} danger={operation === "archive" || operation === "trash"} confirmMessage={operation === "trash" ? "Move this insight to trash? It will be unpublished immediately and can be restored from Audit & recovery." : operation === "archive" ? "Archive this insight? It will leave the public website and can be restored later." : operation === "unpublish" ? "Unpublish this insight? It will immediately leave the public website." : undefined}>{children}</ConfirmedAction>;
}
