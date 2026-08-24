import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getMediaLibrary } from "@/lib/cms/media";
import { CmsShell } from "../cms-shell";
import { MediaLibrary } from "./media-library";

export default async function MediaPage() {
  const session = await requireCmsSession();
  const assets = await getMediaLibrary();
  return <CmsShell active="media" email={session.email} eyebrow="Asset CMS" title="Media library"><MediaLibrary initialAssets={assets} canEdit={cmsRoleCanEdit(session.role)} /></CmsShell>;
}
