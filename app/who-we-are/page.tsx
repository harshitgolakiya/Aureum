import { WhoNarrative } from "@/components/secondary-experiences";
import { PageHero } from "@/components/ui";
import { getCmsContent } from "@/lib/cms/content";
import type { LeaderContent } from "@/lib/cms/schema";

const seniorManagementPlaceholder: LeaderContent = {
  name: "Profile to be announced",
  role: "Senior Management",
  discipline: "Development Operations",
  visualLabel: "",
  portrait: "leadership-portrait-placeholder.webp",
  profilePortrait: "leadership-profile-placeholder.webp",
  biographyOne:
    "This profile is reserved for an additional member of Aureum’s senior management team.",
  biographyTwo:
    "Approved professional information and photography will be added when supplied.",
  biographyThree: "",
  biographyFour: "",
  biographyFive: "",
};

export const metadata = {
  title: "Who We Are",
  description:
    "Aureum brings commercial, technical and strategic thinking together to shape industrial opportunity from every angle.",
  alternates: { canonical: "/who-we-are" },
};
export default async function Page() {
  const [hero, aasim, tejeshree, akhilesh, anish] = await Promise.all([
    getCmsContent("who.hero"),
    getCmsContent("leader.aasim"),
    getCmsContent("leader.tejeshree"),
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
      <WhoNarrative
        executiveLeaders={[aasim, akhilesh, anish]}
        seniorManagement={[tejeshree, seniorManagementPlaceholder]}
      />
    </main>
  );
}
