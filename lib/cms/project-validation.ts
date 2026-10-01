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
  return /^\/(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9/_ .\-]+$/.test(value);
}

function isCanonicalUrl(value: string) {
  return !value || /^\/(?!\/)[^\s]*$/.test(value) || /^https?:\/\/[^\s]+$/i.test(value);
}

function isSocialImage(value: string) {
  return !value || isPublicAssetPath(value) || /^https?:\/\/[^\s]+$/i.test(value);
}

export function validateProjectDraft(project: Project) {
  const errors: Record<string, string> = {};
  if (project.details) {
    const details = project.details;
    if (JSON.stringify(details).length > 60000) errors.details = "Keep facility content under 60,000 characters.";
    if (details.specifications.length > 30 || details.sections.length > 20 || details.features.length > 40 || details.sectors.length > 40) errors.details = "Use at most 30 specifications, 20 sections and 40 features or sectors.";
    details.specifications.forEach((spec, index) => { if (!spec.label.trim() || !spec.value.trim()) errors[`details.specifications.${index}`] = "Add both a label and value, or remove this row."; });
    details.sections.forEach((section, index) => { if (!section.title.trim() || !section.body.trim()) errors[`details.sections.${index}`] = "Add both a heading and body, or remove this section."; });
    if (details.brochure && (!isPublicAssetPath(details.brochure) || !/\.pdf$/i.test(details.brochure))) errors["details.brochure"] = "Use a public PDF path.";
    if (details.contactPhone && !/^\+?[\d\s()-]{7,30}$/.test(details.contactPhone)) errors["details.contactPhone"] = "Enter a valid phone number.";
  }
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
  if (project.homepageImage && !isPublicAssetPath(project.homepageImage)) {
    errors.homepageImage = "Use a public asset path beginning with /, such as /media/projects/homepage-slide.webp.";
  }
  if (project.homepageHeadline.length > 300) errors.homepageHeadline = "Keep the homepage headline under 300 characters.";
  if (project.homepageSubline.length > 300) errors.homepageSubline = "Keep the homepage location line under 300 characters.";
  if (project.homepageTagline.length > 1000) errors.homepageTagline = "Keep the tagline under 1,000 characters.";
  if (project.homepageTaglineSub.length > 1000) errors.homepageTaglineSub = "Keep the tagline sub-line under 1,000 characters.";
  if (project.homepageClosing.length > 1000) errors.homepageClosing = "Keep the closing line under 1,000 characters.";
  if (project.homepageServices.length > 1000) errors.homepageServices = "Keep the service list under 1,000 characters.";
  if (project.homepageSpecs.length > 3000) errors.homepageSpecs = "Keep the homepage details under 3,000 characters.";
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
    ["type", "Add the asset type."],
    ["category", "Choose a category."],
    ["metric", "Add a defining metric."],
    ["status", "Add the development status."],
    ["philosophy", "Add the listing summary."],
    ["engagement", "Add the engagement model."],
  ];
  if (!project.details) required.push(["location", "Add the project location."], ["coverImage", "Choose a cover image."], ["opportunity", "Complete The Opportunity chapter."], ["strategy", "Complete The Strategy chapter."], ["delivery", "Complete The Delivery chapter."], ["outcome", "Complete The Outcome chapter."]);
  else {
    if (!project.details.headline.trim()) errors["details.headline"] = "Add the facility headline.";
    if (!project.details.offering.trim()) errors["details.offering"] = "Add the commercial offering.";
    if (!project.details.specifications.length) errors.details = "Add at least one specification.";
  }
  for (const [field, message] of required) {
    const value = project[field];
    if (typeof value !== "string" || !value.trim() || /^\[.*\]$/.test(value.trim())) {
      errors[field] = message;
    }
  }
  if (project.coverImage && !isPublicAssetPath(project.coverImage)) {
    errors.coverImage = "Choose a valid cover image before publishing.";
  }
  if (project.homepageFeatured) {
    if (!project.details && !project.homepageImage.trim()) errors.homepageImage = "Choose the homepage slide image to show this project on the homepage.";
    if (!project.details && !project.homepageHeadline.trim()) errors.homepageHeadline = "Add the homepage headline to show this project on the homepage.";
  }
  return errors;
}
