import Image from "next/image";
import Link from "next/link";
import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getTeamMembers } from "@/lib/cms/team";
import { ConfirmedAction } from "../confirmed-action";
import { CmsShell } from "../cms-shell";
import { deleteTeamMemberAction } from "./actions";

function queryValue(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [session, members, query] = await Promise.all([requireCmsSession(), getTeamMembers(true), searchParams]);
  const canEdit = cmsRoleCanEdit(session.role);
  const deleted = queryValue(query.deleted);
  const error = queryValue(query.error);
  return <CmsShell active="team" email={session.email} role={session.role} eyebrow="People CMS" title="Team" actions={canEdit ? <Link className="cms-primary-action" href="/admin/team/new">Add team member</Link> : undefined}>
    <div className="cms-library">
      {deleted && <div className="cms-alert cms-alert-success">“{deleted}” was removed from the team.</div>}
      {error && <div className="cms-alert cms-alert-error">The team member could not be found.</div>}
      <section className="cms-library-summary"><div><p className="cms-eyebrow">Team directory</p><h2>Manage leadership profiles and their display order.</h2><p>Draft profiles stay in the CMS until they are ready to appear on the website.</p></div><div className="cms-library-counts"><span><strong>{members.filter((member) => member.published).length}</strong>Published</span><span><strong>{members.filter((member) => !member.published).length}</strong>Drafts</span></div></section>
      {members.length ? <div className="cms-project-table">
        <div className="cms-project-table-head"><span>Team member</span><span>Status</span><span>Group / Discipline</span><span>Order</span><span>Updated</span><span><span className="sr-only">Actions</span></span></div>
        {members.map((member) => <article className="cms-project-row" key={member.slug}>
          <div className="cms-project-identity"><div className="cms-project-thumb">{member.portrait.startsWith("/") && <Image src={member.portrait} alt="" fill sizes="72px" />}</div><div><strong>{member.name}</strong><small>{member.role}</small></div></div>
          <div><span className={`cms-record-status ${member.published ? "is-published" : "is-draft"}`}><i />{member.published ? "Published" : "Draft"}</span></div>
          <div className="cms-project-context"><strong>{member.group === "executive" ? "Executive Leadership" : "Senior Management"}</strong><small>{member.discipline}</small></div>
          <div className="cms-project-order">{String(member.sortOrder).padStart(2, "0")}</div>
          <time dateTime={member.updatedAt.toISOString()}>{member.updatedAt.getTime() ? member.updatedAt.toLocaleDateString("en-AE", { timeZone: "Asia/Dubai" }) : "Fallback"}</time>
          <details className="cms-row-actions"><summary aria-label={`Actions for ${member.name}`}>•••</summary><div>{canEdit && <Link href={`/admin/team/${member.slug}`}>Edit member</Link>}{canEdit && <ConfirmedAction action={deleteTeamMemberAction} slug={member.slug} operation="delete" danger confirmMessage={`Remove ${member.name} from the team? The profile will immediately leave the public website.`}>Delete member</ConfirmedAction>}</div></details>
        </article>)}
      </div> : <section className="cms-library-empty"><h2>No team members yet.</h2><p>Add the first profile to begin building the team directory.</p>{canEdit && <Link href="/admin/team/new">Add team member</Link>}</section>}
    </div>
  </CmsShell>;
}
