import { getCmsSession } from "@/lib/cms/auth";
import { getAllCmsEnquiries } from "@/lib/cms/enquiries";

function csvCell(value: string | number | Date) {
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const session = await getCmsSession();
  if (!session) return new Response("Authentication required.", { status: 401 });
  if (session.role !== "administrator" && session.role !== "editor") return new Response("Insufficient permissions.", { status: 403 });
  const enquiries = await getAllCmsEnquiries();
  const headings = ["ID", "Submitted at (UTC)", "Status", "Name", "Organisation", "Role", "Email", "Phone", "Interest", "Opportunity", "Source", "Notification status"];
  const rows = enquiries.map((entry) => [entry.id, entry.submittedAt, entry.status, entry.name, entry.organisation, entry.role, entry.email, entry.phone, entry.interest, entry.opportunity, entry.source, entry.notificationStatus]);
  const csv = `\uFEFF${[headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aureum-enquiries-${date}.csv"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
