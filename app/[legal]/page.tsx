import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui";

const pages: Record<string, string> = {
  "privacy-policy": "Privacy Policy",
  terms: "Terms",
  "cookie-policy": "Cookie Policy",
};

export function generateStaticParams() {
  return Object.keys(pages).map((legal) => ({ legal }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ legal: string }>;
}): Promise<Metadata> {
  const { legal } = await params;
  return {
    title: pages[legal] || "Legal",
    robots: { index: false, follow: false },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  if (!pages[legal]) notFound();
  return (
    <main>
      <PageHero
        eyebrow="Legal"
        title={pages[legal]}
        copy="Legal content is pending review and approval."
        image="/media/heroes/home.png"
      />
      <section className="legal-copy">
        <aside>
          <small>Document status</small>
          <strong>Awaiting approval</strong>
          <span>Not indexed</span>
        </aside>
        <div>
          <p className="legal-kicker">Controlled content state</p>
          <h2>Approved document pending.</h2>
          <p>
            Aureum has not yet supplied approved legal copy for this page. No
            legal obligations, policies or terms have been fabricated.
          </p>
          <div className="legal-checklist">
            <span>
              <i /> Document structure reserved
            </span>
            <span>
              <i /> Search indexing disabled
            </span>
            <span>
              <i /> Publication requires approval
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
