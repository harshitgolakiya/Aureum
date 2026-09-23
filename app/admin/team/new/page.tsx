import { requireCmsRole } from "@/lib/cms/auth";
import { CmsShell } from "../../cms-shell";
import { TeamEditor } from "../team-editor";

export default async function NewTeamMemberPage() {
  const session = await requireCmsRole("administrator", "editor");
  return <CmsShell active="team" email={session.email} role={session.role} eyebrow="People CMS" title="Add team member"><TeamEditor /></CmsShell>;
}
