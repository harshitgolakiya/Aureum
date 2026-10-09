import { cmsRoleCanEdit, requireCmsSession } from "@/lib/cms/auth";
import { getMediaLibrary } from "@/lib/cms/media";
import { getUploadStorageStatus } from "@/lib/cms/media-storage";
import { CmsShell } from "../cms-shell";
import { MediaLibrary } from "./media-library";

export default async function MediaPage() {
  const session = await requireCmsSession();
  const canEdit = cmsRoleCanEdit(session.role);
  const [assets, storage] = await Promise.all([getMediaLibrary(), canEdit ? getUploadStorageStatus() : Promise.resolve(undefined)]);
  return <CmsShell active="media" email={session.email} eyebrow="Asset CMS" title="Media library"><MediaLibrary initialAssets={assets} canEdit={canEdit} storage={storage} /></CmsShell>;
}
