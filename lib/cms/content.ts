import "server-only";

import type { ResultSetHeader } from "mysql2/promise";
import { connection } from "next/server";
import {
  ensureCmsSchema,
  getCmsPool,
  type CmsEntryRow,
} from "./database";
import {
  CMS_DEFINITIONS,
  cmsDefinitionByKey,
  type CmsContentMap,
  type CmsDefinition,
  type CmsKey,
} from "./schema";

let didWarnAboutDatabase = false;

function warnOnce(error: unknown) {
  if (didWarnAboutDatabase) return;
  didWarnAboutDatabase = true;
  console.warn(
    "CMS database is unavailable; rendering checked-in fallback content.",
    error instanceof Error ? error.message : error,
  );
}

function parseJsonValue(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function normalizeContent<K extends CmsKey>(
  definition: CmsDefinition<K>,
  value: unknown,
): CmsContentMap[K] {
  const candidate = parseJsonValue(value);
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return definition.fallback;
  }
  const source = candidate as Record<string, unknown>;
  const normalized = { ...definition.fallback } as Record<string, string>;
  for (const field of definition.fields) {
    const fieldValue = source[field.name];
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      normalized[field.name] = fieldValue.trim();
    }
  }
  return normalized as CmsContentMap[K];
}

export async function getCmsContent<K extends CmsKey>(
  key: K,
): Promise<CmsContentMap[K]> {
  await connection();
  const definition = cmsDefinitionByKey[key] as unknown as CmsDefinition<K>;
  const database = getCmsPool();
  if (!database) return definition.fallback;
  try {
    await ensureCmsSchema();
    const [rows] = await database.execute<CmsEntryRow[]>(
      "SELECT content_key, value_json, updated_at FROM cms_entries WHERE content_key = ? LIMIT 1",
      [key],
    );
    return rows[0]
      ? normalizeContent(definition, rows[0].value_json)
      : definition.fallback;
  } catch (error) {
    warnOnce(error);
    return definition.fallback;
  }
}

export async function getAllCmsContent() {
  await connection();
  const database = getCmsPool();
  const values = Object.fromEntries(
    CMS_DEFINITIONS.map((definition) => [definition.key, definition.fallback]),
  ) as CmsContentMap;
  if (!database) return values;
  try {
    await ensureCmsSchema();
    const [rows] = await database.query<CmsEntryRow[]>(
      "SELECT content_key, value_json, updated_at FROM cms_entries",
    );
    for (const row of rows) {
      const definition = CMS_DEFINITIONS.find(
        (item) => item.key === row.content_key,
      );
      if (!definition) continue;
      values[definition.key] = normalizeContent(
        definition as CmsDefinition,
        row.value_json,
      ) as never;
    }
    return values;
  } catch (error) {
    warnOnce(error);
    return values;
  }
}

export async function getCmsContentUpdateTimes() {
  const database = getCmsPool();
  if (!database) return {} as Partial<Record<CmsKey, Date>>;
  await ensureCmsSchema();
  const [rows] = await database.query<CmsEntryRow[]>("SELECT content_key, value_json, updated_at FROM cms_entries");
  return Object.fromEntries(rows.filter((row) => row.content_key in cmsDefinitionByKey).map((row) => [row.content_key, row.updated_at])) as Partial<Record<CmsKey, Date>>;
}

export async function saveCmsContent<K extends CmsKey>(
  key: K,
  value: CmsContentMap[K],
) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  await database.execute<ResultSetHeader>(
    `INSERT INTO cms_entries (content_key, value_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = CURRENT_TIMESTAMP`,
    [key, JSON.stringify(value)],
  );
}

export async function seedCmsDefaults() {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  for (const definition of CMS_DEFINITIONS) {
    await database.execute<ResultSetHeader>(
      "INSERT IGNORE INTO cms_entries (content_key, value_json) VALUES (?, ?)",
      [definition.key, JSON.stringify(definition.fallback)],
    );
  }
}
