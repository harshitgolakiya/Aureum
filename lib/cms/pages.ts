import "server-only";

import { cmsDefinitionByKey, type CmsContentMap, type CmsField, type CmsKey } from "./schema";

export type CmsPageSlug = "home" | "who-we-are";
export type CmsEditorSlug = CmsPageSlug | "settings";

export type CmsPageConfig = {
  slug: CmsEditorSlug;
  title: string;
  description: string;
  route: string;
  keys: readonly CmsKey[];
};

export const CMS_PAGE_CONFIGS: Record<CmsEditorSlug, CmsPageConfig> = {
  home: {
    slug: "home",
    title: "Homepage",
    description: "Manage the primary homepage positioning and hero narrative.",
    route: "/",
    keys: ["home.hero"],
  },
  "who-we-are": {
    slug: "who-we-are",
    title: "Who We Are",
    description: "Manage the page introduction and all three leadership profiles.",
    route: "/who-we-are",
    keys: ["who.hero", "leader.aasim", "leader.akhilesh", "leader.anish"],
  },
  settings: {
    slug: "settings",
    title: "Global settings",
    description: "Manage footer copy, address, and contact details shared across every route.",
    route: "/",
    keys: ["site.footer"],
  },
};

export function isCmsEditorSlug(value: string): value is CmsEditorSlug {
  return value === "home" || value === "who-we-are" || value === "settings";
}

export function cmsFieldName(key: CmsKey, field: CmsField) {
  return `${key}.${field.name}`;
}

export function contentFromForm(config: CmsPageConfig, formData: FormData) {
  const values: Partial<CmsContentMap> = {};
  for (const key of config.keys) {
    const definition = cmsDefinitionByKey[key];
    const section: Record<string, string> = {};
    for (const field of definition.fields as readonly CmsField[]) {
      const raw = formData.get(cmsFieldName(key, field));
      section[field.name] = typeof raw === "string" ? raw.trim() : "";
    }
    values[key] = section as never;
  }
  return values;
}

export function validatePageContent(config: CmsPageConfig, values: Partial<CmsContentMap>) {
  const errors: Record<string, string> = {};
  for (const key of config.keys) {
    const definition = cmsDefinitionByKey[key];
    const section = values[key] as unknown as Record<string, string>;
    for (const field of definition.fields as readonly CmsField[]) {
      const name = cmsFieldName(key, field);
      const value = section?.[field.name] ?? "";
      if (!value) {
        if (field.required !== false) errors[name] = `${field.label} is required.`;
        continue;
      }
      else if (field.maxLength && value.length > field.maxLength) errors[name] = `Keep this under ${field.maxLength} characters.`;
      else if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[name] = "Enter a valid email address.";
      else if (field.kind === "tel" && !/^\+?[0-9()\-\s.]+$/.test(value)) errors[name] = "Use a valid international phone number.";
      else if (field.kind === "url" && !/^https:\/\/[^\s]+$/i.test(value)) errors[name] = "Enter a complete HTTPS URL.";
      else if (field.name === "portrait" && !/^[A-Za-z0-9/_\-.]+$/.test(value)) errors[name] = "Use a media filename or public asset path.";
    }
  }
  return errors;
}
