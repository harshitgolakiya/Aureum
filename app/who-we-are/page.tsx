import { WhoNarrative } from "@/components/secondary-experiences";
import { Connect, PageHero } from "@/components/ui";
export const metadata = {
  title: "Who We Are",
  description:
    "Aureum brings commercial, technical and strategic thinking together to shape industrial opportunity from every angle.",
  alternates: { canonical: "/who-we-are" },
};
export default function Page() {
  return (
    <main>
      <PageHero
        identity="perspective"
        eyebrow="Who We Are"
        title="Built around a different view of industrial development."
        copy="Industrial development is multi-disciplinary. Aureum brings the right commercial, technical and strategic thinking together to shape the opportunity from every angle."
      />
      <WhoNarrative />
      <Connect
        title="The next opportunity starts with a conversation."
        copy="Every significant development begins with a conversation about ambition, opportunity and long-term value. Whether exploring investment or expansion, Aureum welcomes discussions that begin with possibilities and evolve into enduring partnerships."
      />
    </main>
  );
}
