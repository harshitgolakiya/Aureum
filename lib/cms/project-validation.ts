import type { Project } from "@/data/site";

export const PROJECT_CHAPTERS = ["opportunity", "strategy", "delivery", "outcome"] as const;
export type ProjectChapterKey = (typeof PROJECT_CHAPTERS)[number];

export function slugifyProject(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191);
}

export function normalizeChapterOrder(value: string) {
  const supplied = value.split(",").filter((item): item is ProjectChapterKey =>
    PROJECT_CHAPTERS.includes(item as ProjectChapterKey),
  );
  return [...new Set([...supplied, ...PROJECT_CHAPTERS])].join(",");
}

export function isPublicAssetPath(value: string) {
  return /^\/[A-Za-z0-9/_\-.]+$/.test(value);
}

function isCanonicalUrl(value: string) {
  return !value || /^\/(?!\/)[^\s]*$/.test(value) || /^https?:\/\/[^\s]+$/i.test(value);
}

function isSocialImage(value: string) {
  return !value || isPublicAssetPath(value) || /^https?:\/\/[^\s]+$/i.test(value);
}

export function validateProjectDraft(project: Project) {
  const errors: Record<string, string> = {};
  if (!project.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  }
  if (project.coverImage && !isPublicAssetPath(project.coverImage)) {
    errors.coverImage = "Use a public asset path beginning with /, such as /media/projects/cover.webp.";
  }
  const invalidGallery = project.galleryImages
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .find((item) => !isPublicAssetPath(item));
  if (invalidGallery) errors.galleryImages = `Invalid gallery path: ${invalidGallery}`;
  if (project.name.length > 255) errors.name = "Keep the project name under 255 characters.";
  if (project.seoTitle.length > 300) errors.seoTitle = "Keep the SEO title under 300 characters.";
  if (project.seoDescription.length > 500) errors.seoDescription = "Keep the SEO description under 500 characters.";
  if (!isCanonicalUrl(project.canonicalUrl)) errors.canonicalUrl = "Use an absolute https:// URL or a site path beginning with /.";
  if (project.canonicalUrl.length > 500) errors.canonicalUrl = "Keep the canonical URL under 500 characters.";
  if (project.socialTitle.length > 300) errors.socialTitle = "Keep the social title under 300 characters.";
  if (project.socialDescription.length > 500) errors.socialDescription = "Keep the social description under 500 characters.";
  if (!isSocialImage(project.socialImage)) errors.socialImage = "Choose a media-library image or use a valid https:// image URL.";
  if (project.socialImage.length > 500) errors.socialImage = "Keep the social image URL under 500 characters.";
  return errors;
}

export function validateProjectForPublishing(project: Project) {
  const errors = validateProjectDraft(project);
  const required: Array<[keyof Project, string]> = [
    ["name", "Add the project name."],
    ["location", "Add the project location."],
    ["type", "Add the asset type."],
    ["category", "Choose a category."],
    ["metric", "Add a defining metric."],
    ["status", "Add the development status."],
    ["philosophy", "Add the listing summary."],
    ["engagement", "Add the engagement model."],
    ["coverImage", "Choose a cover image."],
    ["opportunity", "Complete The Opportunity chapter."],
    ["strategy", "Complete The Strategy chapter."],
    ["delivery", "Complete The Delivery chapter."],
    ["outcome", "Complete The Outcome chapter."],
  ];
  for (const [field, message] of required) {
    const value = project[field];
    if (typeof value !== "string" || !value.trim() || /^\[.*\]$/.test(value.trim())) {
      errors[field] = message;
    }
  }
  if (project.coverImage && !isPublicAssetPath(project.coverImage)) {
    errors.coverImage = "Choose a valid cover image before publishing.";
  }
  return errors;
}
