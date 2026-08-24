import type { InsightArticle } from "@/data/site";
import { insightDocumentErrors, isPublicInsightImage, parseInsightDocument } from "./insight-document";

export function slugifyInsight(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 191);
}

function isCanonicalUrl(value: string) {
  return !value || /^\/(?!\/)[^\s]*$/.test(value) || /^https?:\/\/[^\s]+$/i.test(value);
}

function isSocialImage(value: string) {
  return !value || isPublicInsightImage(value) || /^https?:\/\/[^\s]+$/i.test(value);
}

export function validateInsightDraft(insight: InsightArticle) {
  const errors: Record<string, string> = {};
  if (!insight.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(insight.slug)) errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  if (insight.title.length > 300) errors.title = "Keep the title under 300 characters.";
  if (insight.coverImage && !isPublicInsightImage(insight.coverImage)) errors.coverImage = "Use a public asset path beginning with /.";
  if (insight.seoTitle.length > 300) errors.seoTitle = "Keep the SEO title under 300 characters.";
  if (insight.seoDescription.length > 500) errors.seoDescription = "Keep the SEO description under 500 characters.";
  if (!isCanonicalUrl(insight.canonicalUrl)) errors.canonicalUrl = "Use an absolute https:// URL or a site path beginning with /.";
  if (insight.canonicalUrl.length > 500) errors.canonicalUrl = "Keep the canonical URL under 500 characters.";
  if (insight.socialTitle.length > 300) errors.socialTitle = "Keep the social title under 300 characters.";
  if (insight.socialDescription.length > 500) errors.socialDescription = "Keep the social description under 500 characters.";
  if (!isSocialImage(insight.socialImage)) errors.socialImage = "Choose a media-library image or use a valid https:// image URL.";
  if (insight.socialImage.length > 500) errors.socialImage = "Keep the social image URL under 500 characters.";
  const documentErrors = insightDocumentErrors(parseInsightDocument(insight.bodyDocument));
  if (documentErrors.length) errors.bodyDocument = documentErrors[0];
  return errors;
}

export function validateInsightForPublishing(insight: InsightArticle) {
  const errors = validateInsightDraft(insight);
  const required: Array<[keyof InsightArticle, string]> = [
    ["title", "Add the article title."], ["excerpt", "Add the article summary."],
    ["author", "Add the author name."], ["authorTitle", "Add the author title."],
    ["category", "Choose a category."], ["date", "Add the publication date."],
    ["readTime", "Add the estimated reading time."], ["coverImage", "Choose a cover image."],
  ];
  for (const [field, message] of required) {
    const value = insight[field];
    if (typeof value !== "string" || !value.trim() || /^\[.*\]$/.test(value.trim())) errors[field] = message;
  }
  const blocks = parseInsightDocument(insight.bodyDocument);
  if (!blocks.length) errors.bodyDocument = "Add at least one article content block.";
  return errors;
}
