import { InsightsLanding } from "@/components/insights-experience";
import { PageHero } from "@/components/ui";
import { getPosts } from "@/lib/cms/collections";
export const metadata = {
  title: "Insights",
  description:
    "Research, commercial intelligence and industry perspectives from Aureum Development.",
  alternates: { canonical: "/insights" },
};
export default async function Page() {
  const articles = await getPosts();
  return (
    <main>
      <PageHero
        identity="insights"
        eyebrow="Insights"
        title="Insight creates advantage before action."
        copy="Markets evolve constantly, but meaningful opportunities reveal themselves long before they become widely recognised. Aureum brings together research, commercial insight and industry expertise to help clients anticipate change and invest with confidence."
      />
      <InsightsLanding articles={articles} />
    </main>
  );
}
