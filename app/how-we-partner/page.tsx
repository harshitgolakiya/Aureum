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
        eyebrow="What We Do"
        title="Different opportunities. One way of thinking."
      />
      <PartnerJourney />
      <PartnerConvergence />
      <Connect
        compact
        title="The right conversation shapes the right outcome."
        copy="Meaningful partnerships begin with understanding the opportunity, not prescribing the solution. Every engagement starts by defining success before determining the path."
      />
    </main>
  );
}
