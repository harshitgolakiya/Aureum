import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui";

const pages: Record<string, string> = {
  "privacy-policy": "Privacy Policy",
  terms: "Terms",
  "cookie-policy": "Cookie Policy",
};

const legalContent: Record<
  string,
  { intro: string; sections: { title: string; body: string }[] }
> = {
  "privacy-policy": {
    intro:
      "This Privacy Policy explains how Aureum collects, uses and protects personal information when you use this website or contact us about our services.",
    sections: [
      {
        title: "Information we collect",
        body:
          "We may collect the information you provide through our contact form, such as your name, organisation, role, email address, phone number and project enquiry. We may also receive technical information such as your IP address, browser type and pages visited.",
      },
      {
        title: "How we use information",
        body:
          "We use personal information to respond to enquiries, provide requested information, operate and improve this website, protect our systems and comply with applicable legal obligations. We do not sell personal information.",
      },
      {
        title: "Sharing and retention",
        body:
          "We may share information with trusted service providers who help us operate the website and communicate with you. They may only use it for the services they provide to us. We retain information only for as long as reasonably necessary for the purposes described here or as required by law.",
      },
      {
        title: "Your choices",
        body:
          "You may ask us to access, correct or delete personal information we hold about you, subject to applicable law. To make a request or ask a privacy question, contact us through the Contact page.",
      },
    ],
  },
  terms: {
    intro:
      "These Terms govern your use of the Aureum website. By using this website, you agree to use it lawfully and in accordance with these Terms.",
    sections: [
      {
        title: "Website content",
        body:
          "The website and its content are provided for general information about Aureum and its services. We aim to keep information accurate and current, but we do not guarantee that all content is complete, current or error-free.",
      },
      {
        title: "No professional advice",
        body:
          "Information on this website is not legal, financial, investment, planning or other professional advice. You should obtain advice appropriate to your circumstances before making decisions based on website content.",
      },
      {
        title: "Acceptable use",
        body:
          "You must not misuse this website, interfere with its operation, attempt unauthorised access, introduce malicious code or use its content in a way that infringes another person's rights.",
      },
      {
        title: "Intellectual property and liability",
        body:
          "Unless otherwise stated, website content belongs to Aureum or its licensors and may not be reused without permission. To the extent permitted by law, Aureum is not liable for loss arising from reliance on this website or temporary unavailability of its content.",
      },
      {
        title: "Changes and contact",
        body:
          "We may update these Terms from time to time by publishing a revised version on this page. Questions about these Terms can be sent through the Contact page.",
      },
    ],
  },
  "cookie-policy": {
    intro:
      "This Cookie Policy explains how Aureum uses cookies and similar technologies on this website.",
    sections: [
      {
        title: "What cookies are",
        body:
          "Cookies are small text files stored on your device by a website. They help websites remember preferences, support secure sessions and understand how visitors use the site.",
      },
      {
        title: "How we use them",
        body:
          "Aureum may use strictly necessary cookies to support site functionality, security and administrative sessions. Where analytics or other optional technologies are enabled, they are used to understand website performance and improve the experience.",
      },
      {
        title: "Managing cookies",
        body:
          "You can usually control or delete cookies through your browser settings. Blocking necessary cookies may affect site functionality, including secure areas. Browser settings differ, so consult your browser provider for instructions.",
      },
      {
        title: "Updates",
        body:
          "We may update this policy when our use of cookies changes or when applicable requirements change. The latest version will always be published on this page.",
      },
    ],
  },
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
    robots: { index: true, follow: true },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  if (!pages[legal]) notFound();
  const content = legalContent[legal];
  return (
    <main>
      <PageHero
        eyebrow="Legal"
        title={pages[legal]}
        copy={content.intro}
        image="/media/heroes/home.webp"
      />
      <section className="legal-copy">
        <aside>
          <small>Last updated</small>
          <strong>26 August 2026</strong>
          <span>General information</span>
        </aside>
        <div className="legal-sections">
          <p className="legal-kicker">Aureum legal information</p>
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
