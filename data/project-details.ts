export type ProjectSpecification = { label: string; value: string; note: string };
export type ProjectSection = { title: string; body: string };
export type ProjectDetails = {
  headline: string;
  offering: string;
  specifications: ProjectSpecification[];
  featuresTitle: string;
  features: string[];
  sectors: string[];
  sections: ProjectSection[];
  contactName: string;
  contactPhone: string;
  brochure: string;
  imageCaption: string;
};

export function emptyProjectDetails(): ProjectDetails {
  return { headline: "", offering: "", specifications: [], featuresTitle: "Key features", features: [], sectors: [], sections: [], contactName: "", contactPhone: "", brochure: "", imageCaption: "" };
}

// Used for database reads, submitted forms, and old revision snapshots.
export function parseProjectDetails(value: unknown): ProjectDetails | undefined {
  if (!value) return undefined;
  const source: unknown = typeof value === "string" ? JSON.parse(value) : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Invalid facility details.");
  const item = source as Record<string, unknown>;
  const string = (key: string) => typeof item[key] === "string" ? item[key] as string : "";
  const strings = (key: string) => Array.isArray(item[key]) ? (item[key] as unknown[]).filter((entry): entry is string => typeof entry === "string") : [];
  const specifications = Array.isArray(item.specifications) ? item.specifications.map((entry: unknown) => {
    const spec = entry as Record<string, unknown>;
    if (!spec || typeof spec.label !== "string" || typeof spec.value !== "string") throw new Error("Invalid specification.");
    return { label: spec.label, value: spec.value, note: typeof spec.note === "string" ? spec.note : "" };
  }) : [];
  const sections = Array.isArray(item.sections) ? item.sections.map((entry: unknown) => {
    const section = entry as Record<string, unknown>;
    if (!section || typeof section.title !== "string" || typeof section.body !== "string") throw new Error("Invalid section.");
    return { title: section.title, body: section.body };
  }) : [];
  return { headline: string("headline"), offering: string("offering"), specifications, featuresTitle: string("featuresTitle"), features: strings("features"), sectors: strings("sectors"), sections, contactName: string("contactName"), contactPhone: string("contactPhone"), brochure: string("brochure"), imageCaption: string("imageCaption") };
}
