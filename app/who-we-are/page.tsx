import { WhoNarrative } from "@/components/secondary-experiences";
import { PageHero } from "@/components/ui";
import { getCmsContent } from "@/lib/cms/content";
import { getTeamMembers } from "@/lib/cms/team";

export const metadata = {
  title: "Who We Are",
  description:
    "Aureum brings commercial, technical and strategic thinking together to shape industrial opportunity from every angle.",
  alternates: { canonical: "/who-we-are" },
};
export default async function Page() {
  const [hero, team] = await Promise.all([
    getCmsContent("who.hero"),
    getTeamMembers(),
  ]);
  return (
    <main>
      <PageHero
        identity="perspective"
        eyebrow={hero.eyebrow}
        title={hero.title}
        copy={hero.copy}
      />
      <WhoNarrative
        executiveLeaders={team.filter((member) => member.group === "executive")}
        seniorManagement={team.filter((member) => member.group === "senior")}
      />
    </main>
  );
}
