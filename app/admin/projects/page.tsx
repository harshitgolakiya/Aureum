import Image from "next/image";
import Link from "next/link";
import { projectLibraryAction } from "../actions";
import { CmsShell } from "../cms-shell";
import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getCmsProjectLibrary, type CmsProjectListItem } from "@/lib/cms/collections";
import { ConfirmedAction } from "../confirmed-action";

const PAGE_SIZE = 8;
const statusValues = ["all", "published", "draft", "scheduled", "unpublished", "archived"] as const;
const sortValues = ["updated", "name", "order"] as const;

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function projectStatus(project: CmsProjectListItem) {
  return project.workflowStatus[0].toUpperCase() + project.workflowStatus.slice(1);
}

function pageHref(query: Record<string, string>, page: number) {
  const params = new URLSearchParams(query);
  params.set("page", String(page));
  return `/admin/projects?${params.toString()}`;
}

export default async function ProjectsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireCmsSession();
  const [projects, query] = await Promise.all([getCmsProjectLibrary(), searchParams]);
  const canEdit = cmsRoleCanEdit(session.role);
  const search = queryValue(query.q).trim();
  const requestedStatus = queryValue(query.status).toLowerCase();
  const status = statusValues.includes(requestedStatus as (typeof statusValues)[number]) ? requestedStatus : "all";
  const requestedSort = queryValue(query.sort).toLowerCase();
  const sort = sortValues.includes(requestedSort as (typeof sortValues)[number]) ? requestedSort : "updated";
  const category = queryValue(query.category);
  const categories = [...new Set(projects.map((project) => project.category))].sort((a, b) => a.localeCompare(b));
  const searchLower = search.toLowerCase();

  const filtered = projects
    .filter((project) => !searchLower || [project.name, project.slug, project.location, project.category, project.type].some((value) => value.toLowerCase().includes(searchLower)))
    .filter((project) => !category || project.category === category)
    .filter((project) => {
      if (status !== "all") return project.workflowStatus === status;
      return true;
    })
    .sort((left, right) => {
      if (sort === "name") return left.name.localeCompare(right.name);
      if (sort === "order") return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
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
  const error = queryValue(query.error);

  return (
    <CmsShell
      active="projects"
      email={session.email}
      eyebrow="Portfolio CMS"
      title="Projects"
      actions={canEdit ? <Link className="cms-primary-action" href="/admin/projects/new">New project</Link> : undefined}
    >
      <div className="cms-library">
        {updated && <div className="cms-alert cms-alert-success">Project “{updated}” was updated successfully.</div>}
        {created && <div className="cms-alert cms-alert-success">Draft copy “{created}” was created.</div>}
        {error && <div className="cms-alert cms-alert-error">{error === "incomplete" ? "This project is missing required publishing content. Open the editor and complete the highlighted fields." : "The project action could not be completed. Please try again."}</div>}

        <section className="cms-library-summary">
          <div><p className="cms-eyebrow">Project library</p><h2>Find and manage every development.</h2></div>
          <div className="cms-library-counts">
            <span><strong>{projects.filter((item) => item.published && !item.archived).length}</strong>Published</span>
            <span><strong>{projects.filter((item) => !item.published && !item.archived).length}</strong>Drafts</span>
            <span><strong>{projects.filter((item) => item.archived).length}</strong>Archived</span>
          </div>
        </section>

        <form className="cms-library-filters" method="get">
          <label className="cms-search-field"><span>Search projects</span><input name="q" defaultValue={search} placeholder="Name, location, category, or slug" /></label>
          <label><span>Status</span><select name="status" defaultValue={status}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option></select></label>
          <label><span>Category</span><select name="category" defaultValue={category}><option value="">All categories</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <label><span>Sort by</span><select name="sort" defaultValue={sort}><option value="updated">Recently updated</option><option value="name">Project name</option><option value="order">Display order</option></select></label>
          <button type="submit">Apply filters</button>
          {(search || status !== "all" || category || sort !== "updated") && <Link href="/admin/projects">Reset</Link>}
        </form>

        <div className="cms-library-meta">
          <p>Showing <strong>{visible.length}</strong> of <strong>{filtered.length}</strong> matching projects</p>
          <span>Page {currentPage} of {pageCount}</span>
        </div>

        {visible.length ? (
          <div className="cms-project-table">
            <div className="cms-project-table-head"><span>Project</span><span>Status</span><span>Category / Location</span><span>Order</span><span>Updated</span><span><span className="sr-only">Actions</span></span></div>
            {visible.map((project) => (
              <article className="cms-project-row" key={project.slug}>
                <div className="cms-project-identity">
                  <div className="cms-project-thumb"><Image src={project.coverImage} alt="" fill sizes="72px" /></div>
                  <div><strong>{project.name}</strong><small>/{project.slug}</small></div>
                </div>
                <div><span className={`cms-record-status is-${projectStatus(project).toLowerCase()}`}><i />{projectStatus(project)}</span></div>
                <div className="cms-project-context"><strong>{project.category}</strong><small>{project.location}</small></div>
                <div className="cms-project-order">{String(project.sortOrder).padStart(2, "0")}</div>
                <time dateTime={project.updatedAt.toISOString()}>{formatter.format(project.updatedAt)}</time>
                <details className="cms-row-actions">
                  <summary aria-label={`Actions for ${project.name}`}>•••</summary>
                  <div>
                    {canEdit && !project.archived && <Link href={`/admin/projects/${project.slug}`}>Edit project</Link>}
                    <Link href={`/admin/projects/${project.slug}/revisions`}>Revision history</Link>
                    {project.published && !project.archived ? <Link href={`/portfolio/${project.slug}`} target="_blank">Preview ↗</Link> : <span className="is-disabled">Preview after publishing</span>}
                    {canEdit && !project.archived && <LibraryAction slug={project.slug} operation="duplicate">Duplicate as draft</LibraryAction>}
                    {canEdit && project.workflowStatus === "scheduled" && <LibraryAction slug={project.slug} operation="cancel_schedule">Cancel schedule</LibraryAction>}
                    {canEdit && !project.archived && project.workflowStatus !== "scheduled" && <LibraryAction slug={project.slug} operation={project.published ? "unpublish" : "publish"}>{project.published ? "Unpublish project" : "Publish project"}</LibraryAction>}
                    {canEdit && <LibraryAction slug={project.slug} operation={project.archived ? "restore" : "archive"}>{project.archived ? "Restore project" : "Archive project"}</LibraryAction>}
                    {canEdit && <LibraryAction slug={project.slug} operation="trash">Move to trash</LibraryAction>}
                  </div>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <section className="cms-library-empty"><h2>No projects match these filters.</h2><p>Try clearing the search or changing the selected status and category.</p><Link href="/admin/projects">Clear all filters</Link></section>
        )}

        {pageCount > 1 && (
          <nav className="cms-pagination" aria-label="Project library pages">
            {currentPage > 1 ? <Link href={pageHref(preservedQuery, currentPage - 1)}>← Previous</Link> : <span />}
            <div>{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <Link aria-current={page === currentPage ? "page" : undefined} className={page === currentPage ? "is-active" : ""} href={pageHref(preservedQuery, page)} key={page}>{page}</Link>)}</div>
            {currentPage < pageCount ? <Link href={pageHref(preservedQuery, currentPage + 1)}>Next →</Link> : <span />}
          </nav>
        )}
      </div>
    </CmsShell>
  );
}

function LibraryAction({ slug, operation, children }: {
  slug: string;
  operation: "publish" | "unpublish" | "archive" | "restore" | "duplicate" | "cancel_schedule" | "trash";
  children: React.ReactNode;
}) {
  return (
    <ConfirmedAction action={projectLibraryAction} slug={slug} operation={operation} danger={operation === "archive" || operation === "trash"} confirmMessage={operation === "trash" ? "Move this project to trash? It will be unpublished immediately and can be restored from Audit & recovery." : operation === "archive" ? "Archive this project? It will leave the public website and can be restored later." : operation === "unpublish" ? "Unpublish this project? It will immediately leave the public website." : undefined}>{children}</ConfirmedAction>
  );
}
