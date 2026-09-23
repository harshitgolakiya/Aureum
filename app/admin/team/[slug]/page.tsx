import { notFound } from "next/navigation";
import { requireCmsRole } from "@/lib/cms/auth";
import { getTeamMember } from "@/lib/cms/team";
import { CmsShell } from "../../cms-shell";
import { TeamEditor } from "../team-editor";

export default async function EditTeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, requireCmsRole("administrator", "editor")]);
  const member = await getTeamMember(slug);
  if (!member) notFound();
  return <CmsShell active="team" email={session.email} role={session.role} eyebrow="People CMS" title={`Edit ${member.name}`}><TeamEditor member={member} /></CmsShell>;
}
