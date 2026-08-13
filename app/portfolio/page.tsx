import { PortfolioListing } from "@/components/portfolio-experience";
import { Connect, PageHero } from "@/components/ui";
export const metadata = {
  title: "Portfolio",
  description:
    "Explore industrial developments shaped through Aureum's 360° Development Perspective.",
  alternates: { canonical: "/portfolio" },
};
export default function Page() {
  return (
    <main>
      <PageHero
        identity="portfolio"
        eyebrow="Portfolio"
        title="Where the Aureum 360° Development Perspective takes form."
        copy="Every development reflects a different opportunity, shaped through the Aureum perspective to create lasting industrial value."
      />
      <PortfolioListing />
      <section className="principle">
        <p>Development approach / 360°</p>
        <h2>
          Consistency is developed on <em>principles.</em>
        </h2>
        <p>
          Different opportunities demand different responses, but the philosophy
          never changes. The Aureum System ensures every development is guided
          by the same standard of thinking.
        </p>
      </section>
      <Connect
        title="Tomorrow’s developments begin with today’s conversations."
        copy="Every future development starts with a shared ambition and the willingness to explore what is possible. Aureum welcomes conversations that lead to enduring partnerships and meaningful outcomes."
      />
    </main>
  );
}
