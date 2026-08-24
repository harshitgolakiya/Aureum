import Link from "next/link";
import { requireCmsRole } from "@/lib/cms/auth";
import { CmsShell } from "../../cms-shell";
import { ProjectEditor } from "../project-editor";

export default async function NewProjectPage() {
  const session = await requireCmsRole("administrator", "editor");
  return (
    <CmsShell active="projects" email={session.email} eyebrow="Projects / New" title="Create project" actions={<Link className="cms-header-link" href="/admin/projects">Back to projects</Link>}>
      <ProjectEditor />
    </CmsShell>
  );
}
