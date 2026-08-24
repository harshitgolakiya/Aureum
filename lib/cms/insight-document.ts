export const INSIGHT_BLOCK_TYPES = ["paragraph", "heading", "list", "quote", "link", "image", "divider"] as const;
export type InsightBlockType = (typeof INSIGHT_BLOCK_TYPES)[number];

export type InsightContentBlock = {
  id: string;
  type: InsightBlockType;
  text?: string;
  level?: 2 | 3;
  style?: "unordered" | "ordered";
  items?: string[];
  href?: string;
  src?: string;
  alt?: string;
  caption?: string;
};

const text = (value: unknown, limit = 12000) => typeof value === "string" ? value.slice(0, limit) : "";

export function isSafeInsightHref(value: string) {
  return /^(https?:\/\/|mailto:|\/)[^\s]+$/i.test(value);
}

export function isPublicInsightImage(value: string) {
  return /^\/[A-Za-z0-9/_\-.]+$/.test(value);
}

export function normalizeInsightDocument(value: unknown): InsightContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 200).flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];
    const source = candidate as Record<string, unknown>;
    if (!INSIGHT_BLOCK_TYPES.includes(source.type as InsightBlockType)) return [];
    const type = source.type as InsightBlockType;
    const block: InsightContentBlock = { id: text(source.id, 80) || `block-${index + 1}`, type };
    if (["paragraph", "heading", "quote", "link"].includes(type)) block.text = text(source.text);
    if (type === "heading") block.level = source.level === 3 ? 3 : 2;
    if (type === "list") {
      block.style = source.style === "ordered" ? "ordered" : "unordered";
      block.items = Array.isArray(source.items) ? source.items.slice(0, 50).map((item) => text(item, 2000)) : [];
    }
    if (type === "link") block.href = text(source.href, 2000);
    if (type === "image") {
      block.src = text(source.src, 2000);
      block.alt = text(source.alt, 500);
      block.caption = text(source.caption, 1000);
    }
    return [block];
  });
}

export function parseInsightDocument(document: string, legacyBody = "") {
  if (document.trim()) {
    try {
      const parsed = normalizeInsightDocument(JSON.parse(document));
      if (parsed.length) return parsed;
    } catch {
      // Invalid documents fall back to the legacy plain-text body.
    }
  }
  const blocks: InsightContentBlock[] = [];
  legacyBody.split(/\n\s*\n/).forEach((paragraph, index) => {
    if (paragraph.trim()) blocks.push({ id: `legacy-${index + 1}`, type: "paragraph", text: paragraph.trim() });
  });
  return blocks;
}

export function serializeInsightDocument(blocks: InsightContentBlock[]) {
  return JSON.stringify(normalizeInsightDocument(blocks));
}

export function insightDocumentPlainText(blocks: InsightContentBlock[]) {
  return blocks.flatMap((block) => {
    if (block.type === "list") return block.items ?? [];
    if (block.type === "image" || block.type === "divider") return [];
    return block.text ? [block.text] : [];
  }).join("\n\n");
}

export function insightDocumentErrors(blocks: InsightContentBlock[]) {
  const errors: string[] = [];
  blocks.forEach((block, index) => {
    const label = `Block ${index + 1}`;
    if (["paragraph", "heading", "quote"].includes(block.type) && !block.text?.trim()) errors.push(`${label} is empty.`);
    if (block.type === "list" && !(block.items ?? []).some((item) => item.trim())) errors.push(`${label} needs at least one list item.`);
    if (block.type === "link" && (!block.text?.trim() || !block.href || !isSafeInsightHref(block.href))) errors.push(`${label} needs link text and a valid web, email, or internal URL.`);
    if (block.type === "image" && (!block.src || !isPublicInsightImage(block.src) || !block.alt?.trim())) errors.push(`${label} needs a valid public image path and alt text.`);
  });
  return errors;
}
