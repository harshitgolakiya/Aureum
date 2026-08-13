import {
  PartnerConvergence,
  PartnerJourney,
} from "@/components/secondary-experiences";
import { Connect, PageHero } from "@/components/ui";
export const metadata = {
  title: "How We Partner",
  description:
    "Explore Aureum's predictive development, development management and strategic partnership pathways.",
  alternates: { canonical: "/how-we-partner" },
};
export default function Page() {
  return (
    <main>
      <PageHero
        identity="pathways"
        eyebrow="How We Partner"
        title="Different opportunities. One way of thinking."
        copy="Every engagement is shaped around the opportunity and its objectives, while remaining grounded in the same disciplined approach to development."
      />
      <PartnerJourney />
      <PartnerConvergence />
      <Connect
        title="The right conversation shapes the right outcome."
        copy="Meaningful partnerships begin with understanding the opportunity, not prescribing the solution. Every engagement starts by defining success before determining the path."
      />
    </main>
  );
}
