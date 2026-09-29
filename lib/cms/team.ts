import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { connection } from "next/server";
import { ensureCmsSchema, getCmsPool } from "./database";
import { cmsDefinitionByKey, type LeaderContent } from "./schema";

export type TeamMemberGroup = "executive" | "senior";

export type TeamMember = LeaderContent & {
  slug: string;
  group: TeamMemberGroup;
  published: boolean;
  sortOrder: number;
};

export type CmsTeamMember = TeamMember & { updatedAt: Date };

type TeamMemberRow = RowDataPacket & {
  slug: string;
  name: string;
  role_title: string;
  discipline: string;
  visual_label: string;
  portrait: string;
  profile_portrait: string;
  biography_one: string;
  biography_two: string;
  biography_three: string;
  biography_four: string;
  biography_five: string;
  leadership_group: TeamMemberGroup;
  published: number | boolean;
  sort_order: number;
  updated_at: Date;
};

const legacyMembers = [
  { key: "leader.aasim", slug: "aasim-ameer", group: "executive", sortOrder: 10 },
  { key: "leader.akhilesh", slug: "akhilesh-padinhare", group: "executive", sortOrder: 20 },
  { key: "leader.anish", slug: "anish-kasim", group: "executive", sortOrder: 30 },
  { key: "leader.tejeshree", slug: "tejeshree-jadhav", group: "senior", sortOrder: 10 },
] as const;

const demoMember: TeamMember = {
  slug: "sivaprasath-balakrishnan",
  name: "Sivaprasath Balakrishnan",
  role: "Associate Director, Industrial Development",
  discipline: "Industrial Development",
  visualLabel: "Development",
  portrait: "/leadership/5_Siva.webp",
  profilePortrait: "/leadership/newbie.webp",
  biographyOne:
    "Sivaprasath Balakrishnan brings deep technical and development expertise to the planning and delivery of industrial and logistics assets across the UAE.",
  biographyTwo:
    "With extensive experience across industrial design, development planning, project delivery and construction management, Sivaprasath brings together technical depth and a practical understanding of how industrial assets need to perform. His experience spans feasibility, design management, authority approvals, procurement, execution and handover, giving him a perspective that connects development intent with delivery realities.",
  biographyThree:
    "A Civil Engineering professional with strong knowledge of civil, structural and MEP systems, Sivaprasath has delivered Built-to-Suit industrial and logistics facilities across the UAE and Qatar. His understanding of manufacturing processes, warehouse operations, distribution networks and industrial workflows enables him to translate occupier requirements into functional, efficient and commercially considered development solutions.",
  biographyFour:
    "As a Certified Sustainability Manager, he brings a strong focus on the long-term performance of industrial assets, with expertise in materials, engineering systems and international construction standards. His approach considers not only how an asset is built, but how design and specification decisions influence energy consumption, maintenance, operational efficiency and lifecycle value.",
  biographyFive:
    "At Aureum, Sivaprasath works across authorities, consultants, contractors, investors and occupiers to align technical design, operational requirements and development objectives. His role spans both purpose-built and speculative industrial development, helping shape assets that respond to evolving occupier needs while maintaining the quality, efficiency and performance expected of institutional-grade real estate.",
  group: "senior",
  published: true,
  sortOrder: 20,
};

function fromRow(row: TeamMemberRow): CmsTeamMember {
  return {
    slug: row.slug,
    name: row.name,
    role: row.role_title,
    discipline: row.discipline,
    visualLabel: row.visual_label,
    portrait: row.portrait,
    profilePortrait: row.profile_portrait,
    biographyOne: row.biography_one,
    biographyTwo: row.biography_two,
    biographyThree: row.biography_three,
    biographyFour: row.biography_four,
    biographyFive: row.biography_five,
    group: row.leadership_group,
    published: Boolean(row.published),
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function normalizeLegacy(value: unknown, fallback: LeaderContent): LeaderContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(fallback).map(([key, fallbackValue]) => [
      key,
      typeof source[key] === "string" ? String(source[key]).trim() : fallbackValue,
    ]),
  ) as LeaderContent;
}

async function seedLegacyTeamOnce() {
  const database = getCmsPool();
  if (!database) return;
  const migrationKey = "2026-09-team-members-collection";
  const [migrations] = await database.execute<RowDataPacket[]>(
    "SELECT 1 FROM cms_migrations WHERE migration_key = ? LIMIT 1",
    [migrationKey],
  );
  if (migrations.length) return;

  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of legacyMembers) {
      const fallback = cmsDefinitionByKey[item.key].fallback;
      const [rows] = await connection.execute<(RowDataPacket & { value_json: unknown })[]>(
        "SELECT value_json FROM cms_entries WHERE content_key = ? LIMIT 1",
        [item.key],
      );
      const stored = rows[0]?.value_json;
      const parsed = typeof stored === "string" ? (() => { try { return JSON.parse(stored) as unknown; } catch { return null; } })() : stored;
      const member = normalizeLegacy(parsed, fallback);
      await connection.execute(
        `INSERT IGNORE INTO cms_team_members
          (slug, name, role_title, discipline, visual_label, portrait, profile_portrait,
           biography_one, biography_two, biography_three, biography_four, biography_five,
           leadership_group, published, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
        [item.slug, member.name, member.role, member.discipline, member.visualLabel, member.portrait,
          member.profilePortrait, member.biographyOne, member.biographyTwo, member.biographyThree,
          member.biographyFour, member.biographyFive, item.group, item.sortOrder],
      );
    }
    await connection.execute(
      "INSERT IGNORE INTO cms_migrations (migration_key, details_json) VALUES (?, ?)",
      [migrationKey, JSON.stringify({ source: "legacy leadership CMS entries", count: legacyMembers.length })],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function seedDemoTeamOnce() {
  const database = getCmsPool();
  if (!database) return;
  const migrationKey = "2026-09-sivaprasath-team-profile";
  const [migrations] = await database.execute<RowDataPacket[]>(
    "SELECT 1 FROM cms_migrations WHERE migration_key = ? LIMIT 1",
    [migrationKey],
  );
  if (migrations.length) return;

  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO cms_team_members
        (slug, name, role_title, discipline, visual_label, portrait, profile_portrait,
         biography_one, biography_two, biography_three, biography_four, biography_five,
         leadership_group, published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), role_title = VALUES(role_title),
         discipline = VALUES(discipline), visual_label = VALUES(visual_label),
         portrait = VALUES(portrait), profile_portrait = VALUES(profile_portrait),
         biography_one = VALUES(biography_one), biography_two = VALUES(biography_two),
         biography_three = VALUES(biography_three), biography_four = VALUES(biography_four),
         biography_five = VALUES(biography_five), leadership_group = VALUES(leadership_group),
         published = VALUES(published), sort_order = VALUES(sort_order), deleted_at = NULL`,
      [demoMember.slug, demoMember.name, demoMember.role, demoMember.discipline,
        demoMember.visualLabel, demoMember.portrait, demoMember.profilePortrait,
        demoMember.biographyOne, demoMember.biographyTwo, demoMember.biographyThree,
        demoMember.biographyFour, demoMember.biographyFive, demoMember.group,
        demoMember.published, demoMember.sortOrder],
    );
    await connection.execute(
      "UPDATE cms_team_members SET published = FALSE, deleted_at = CURRENT_TIMESTAMP WHERE slug = 'maya-rahman-demo' AND deleted_at IS NULL",
    );
    await connection.execute(
      "INSERT IGNORE INTO cms_migrations (migration_key, details_json) VALUES (?, ?)",
      [migrationKey, JSON.stringify({ slug: demoMember.slug, replaces: "maya-rahman-demo" })],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function fallbackMembers(): CmsTeamMember[] {
  return [
    ...legacyMembers.map((item) => ({
      ...cmsDefinitionByKey[item.key].fallback,
      slug: item.slug,
      group: item.group,
      published: true,
      sortOrder: item.sortOrder,
      updatedAt: new Date(0),
    })),
    { ...demoMember, updatedAt: new Date(0) },
  ];
}

export async function getTeamMembers(includeDrafts = false): Promise<CmsTeamMember[]> {
  await connection();
  const database = getCmsPool();
  if (!database) return fallbackMembers();
  try {
    await ensureCmsSchema();
    await seedLegacyTeamOnce();
    await seedDemoTeamOnce();
    const [rows] = await database.query<TeamMemberRow[]>(
      `SELECT slug, name, role_title, discipline, visual_label, portrait, profile_portrait,
        biography_one, biography_two, biography_three, biography_four, biography_five,
        leadership_group, published, sort_order, updated_at
       FROM cms_team_members
       WHERE deleted_at IS NULL${includeDrafts ? "" : " AND published = TRUE"}
       ORDER BY FIELD(leadership_group, 'executive', 'senior'), sort_order ASC, name ASC`,
    );
    return rows.map(fromRow);
  } catch (error) {
    console.warn("CMS team members are unavailable; using checked-in fallbacks.", error);
    return fallbackMembers();
  }
}

export async function getTeamMember(slug: string) {
  const members = await getTeamMembers(true);
  return members.find((member) => member.slug === slug) ?? null;
}

export async function saveTeamMember(originalSlug: string, member: TeamMember) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  await seedLegacyTeamOnce();
  await seedDemoTeamOnce();
  if (originalSlug && originalSlug !== member.slug) {
    const [renamed] = await database.execute<ResultSetHeader>(
      "UPDATE cms_team_members SET slug = ? WHERE slug = ? AND deleted_at IS NULL",
      [member.slug, originalSlug],
    );
    if (!renamed.affectedRows) throw new Error("Team member not found.");
  }
  await database.execute<ResultSetHeader>(
    `INSERT INTO cms_team_members
      (slug, name, role_title, discipline, visual_label, portrait, profile_portrait,
       biography_one, biography_two, biography_three, biography_four, biography_five,
       leadership_group, published, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), role_title = VALUES(role_title),
       discipline = VALUES(discipline), visual_label = VALUES(visual_label),
       portrait = VALUES(portrait), profile_portrait = VALUES(profile_portrait),
       biography_one = VALUES(biography_one), biography_two = VALUES(biography_two),
       biography_three = VALUES(biography_three), biography_four = VALUES(biography_four),
       biography_five = VALUES(biography_five), leadership_group = VALUES(leadership_group),
       published = VALUES(published), sort_order = VALUES(sort_order), deleted_at = NULL`,
    [member.slug, member.name, member.role, member.discipline, member.visualLabel, member.portrait,
      member.profilePortrait, member.biographyOne, member.biographyTwo, member.biographyThree,
      member.biographyFour, member.biographyFive, member.group, member.published, member.sortOrder],
  );
}

export async function deleteTeamMember(slug: string) {
  const database = getCmsPool();
  if (!database) throw new Error("DATABASE_URL is not configured.");
  await ensureCmsSchema();
  const [result] = await database.execute<ResultSetHeader>(
    "UPDATE cms_team_members SET published = FALSE, deleted_at = CURRENT_TIMESTAMP WHERE slug = ? AND deleted_at IS NULL",
    [slug],
  );
  if (!result.affectedRows) throw new Error("Team member not found.");
}

export function slugifyTeamMember(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 191);
}
