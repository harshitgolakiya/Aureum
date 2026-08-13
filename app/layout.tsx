import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import "./pages.css";
import "./interactions.css";
import "./content-completion.css";
import "./system-masterplan.css";
import "./engagement.css";
import "./global-interactions.css";
import "./secondary-experiences.css";
import "./portfolio-experience.css";
import "./insights-experience.css";
import "./contact-experience.css";
import "./production-qa.css";
import "./route-experience.css";
import "./status-pages.css";
import "./media-placeholders.css";
import "./page-hero-identities.css";
import "./pending-states.css";
import "./control-system.css";
import "./launch-polish.css";
import { Footer, Header } from "@/components/layout";
import { RouteExperience } from "@/components/route-experience";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const metadata: Metadata = {
  title: {
    default: "Aureum — The 360° Industrial Developer",
    template: "%s — Aureum",
  },
  description:
    "Aureum brings intelligence, strategy and disciplined execution together to shape industrial opportunities into enduring developments.",
  metadataBase: new URL(siteUrl),
  applicationName: "Aureum",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Aureum — The 360° Industrial Developer",
    description: "From opportunity to sustainable long-term performance.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aureum — The 360° Industrial Developer",
    description: "From opportunity to sustainable long-term performance.",
  },
};

export const viewport = {
  themeColor: "#101a2b",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Aureum",
              url: siteUrl,
              description:
                "Aureum brings intelligence, strategy and disciplined execution together to shape industrial opportunities into enduring developments.",
              publisher: {
                "@type": "Organization",
                name: "Aureum Development",
                url: siteUrl,
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Header />
        <RouteExperience>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <Footer />
        </RouteExperience>
      </body>
    </html>
  );
}
