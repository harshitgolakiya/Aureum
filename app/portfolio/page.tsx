import { PortfolioListing } from "@/components/portfolio-experience";
import { PageHero } from "@/components/ui";
import { getProjects } from "@/lib/cms/collections";
export const metadata = {
  title: "Portfolio",
  description:
    "Explore Aureum's available logistics, industrial and commercial facilities, including purpose-built opportunities and ready-to-move-in space.",
  alternates: { canonical: "/portfolio" },
};
export default async function Page() {
  const projects = await getProjects();
  return (
    <main>
      <PageHero
        identity="portfolio"
        eyebrow="Portfolio"
        title="Where the Aureum 360° Development Perspective takes form."
        copy="Explore available logistics, industrial and commercial facilities, from ready-to-move-in space to purpose-built opportunities shaped around your business."
      />
      <PortfolioListing projects={projects} />
      <section className="principle">
        <p>Development approach / 360°</p>
        <h2>
          Consistency is developed on <em>principles.</em>
        </h2>
        <p>
          The Aureum System ensures every development is guided by the same
          standard of thinking.
        </p>
      </section>
    </main>
  );
}
