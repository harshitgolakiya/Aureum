import Link from "next/link";
import { getCmsRevisions, type CmsContentType, type CmsRevision } from "@/lib/cms/revisions";
import { ConfirmedAction } from "./confirmed-action";
import { restoreRevisionAction } from "./revision-actions";

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function displayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function revisionLabel(revision: CmsRevision) {
  return `#${revision.id} · ${revision.event.replaceAll("_", " ")} · ${revision.createdAt.toLocaleString("en-AE", { timeZone: "Asia/Dubai" })}`;
}

export async function RevisionHistory({
  contentType,
  slug,
  title,
  query,
  canRestore,
}: {
  contentType: CmsContentType;
  slug: string;
  title: string;
  query: Record<string, string | string[] | undefined>;
  canRestore: boolean;
}) {
  const revisions = await getCmsRevisions(contentType, slug);
  const requestedLeft = Number.parseInt(queryValue(query.left), 10);
  const requestedRight = Number.parseInt(queryValue(query.right), 10);
  const left = revisions.find((item) => item.id === requestedLeft) ?? revisions[1] ?? revisions[0];
  const right = revisions.find((item) => item.id === requestedRight) ?? revisions[0];
  const keys = [...new Set([
    ...Object.keys((left?.snapshot ?? {}) as object),
    ...Object.keys((right?.snapshot ?? {}) as object),
  ])];
  const collection = contentType === "project" ? "projects" : "insights";

  return (
    <div className="cms-revisions">
      <header className="cms-revision-header"><div><p className="cms-eyebrow">Revision history</p><h2>{title}</h2><p>Every save and publishing event is retained with its editor and timestamp.</p></div><Link className="cms-primary-action" href={`/admin/${collection}/${slug}`}>Back to editor</Link></header>
      {!revisions.length ? <section className="cms-library-empty"><h2>No revisions yet.</h2><p>Save this item in its editor to create the first revision.</p></section> : <>
        <form className="cms-revision-picker" method="get"><label><span>Earlier revision</span><select name="left" defaultValue={left?.id}>{revisions.map((item) => <option key={item.id} value={item.id}>{revisionLabel(item)}</option>)}</select></label><label><span>Later revision</span><select name="right" defaultValue={right?.id}>{revisions.map((item) => <option key={item.id} value={item.id}>{revisionLabel(item)}</option>)}</select></label><button type="submit">Compare</button></form>
        {left && right && <section className="cms-revision-compare"><header><strong>Field</strong><strong>{revisionLabel(left)}</strong><strong>{revisionLabel(right)}</strong></header>{keys.map((key) => { const before = displayValue((left.snapshot as unknown as Record<string, unknown>)[key]); const after = displayValue((right.snapshot as unknown as Record<string, unknown>)[key]); return <div className={before === after ? "" : "is-changed"} key={key}><strong>{key}</strong><pre>{before}</pre><pre>{after}</pre></div>; })}</section>}
        <section className="cms-revision-timeline"><h2>All revisions</h2>{revisions.map((revision) => <article key={revision.id}><div><strong>{revision.event.replaceAll("_", " ")}</strong><small>{revision.editorEmail} · {revision.createdAt.toLocaleString("en-AE", { timeZone: "Asia/Dubai" })}</small></div>{canRestore && <ConfirmedAction action={restoreRevisionAction} slug={slug} operation="restore_revision" fields={{ contentType, revisionId: String(revision.id) }} confirmMessage="Restore this revision? The restored content will be unpublished so you can review it safely.">Restore</ConfirmedAction>}</article>)}</section>
      </>}
    </div>
  );
}
