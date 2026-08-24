import { WhoNarrative } from "@/components/secondary-experiences";
import { Connect, PageHero } from "@/components/ui";
import { getCmsContent } from "@/lib/cms/content";
export const metadata = {
  title: "Who We Are",
  description:
    "Aureum brings commercial, technical and strategic thinking together to shape industrial opportunity from every angle.",
  alternates: { canonical: "/who-we-are" },
};
export default async function Page() {
  const [hero, aasim, akhilesh, anish] = await Promise.all([
    getCmsContent("who.hero"),
    getCmsContent("leader.aasim"),
    getCmsContent("leader.akhilesh"),
    getCmsContent("leader.anish"),
  ]);
  return (
    <main>
      <PageHero
        identity="perspective"
        eyebrow={hero.eyebrow}
        title={hero.title}
        copy={hero.copy}
      />
      <WhoNarrative leaders={[aasim, akhilesh, anish]} />
      <Connect
        title="The next opportunity starts with a conversation."
        copy="Every significant development begins with a conversation about ambition, opportunity and long-term value. Whether exploring investment or expansion, Aureum welcomes discussions that begin with possibilities and evolve into enduring partnerships."
      />
    </main>
  );
}
