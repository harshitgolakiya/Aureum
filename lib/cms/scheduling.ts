const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

export function parseDubaiDateTimeLocal(value: string) {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(normalized)) return null;
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  const date = new Date(`${withSeconds}+04:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDubaiDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + DUBAI_OFFSET_MS).toISOString().slice(0, 16);
}
