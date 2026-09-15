import type { Metadata } from "next";
import { Manrope } from "next/font/google";
/*import { Suspense } from "react";*/
import "./globals.css";
import "./pages.css";
import "./interactions.css";
import "./content-completion.css";
import "./engagement.css";
import "./global-interactions.css";
import "./secondary-experiences.css";
import "./portfolio-experience.css";
import "./insights-experience.css";
import "./contact-experience.css";
import "./conversation-modal.css";
import "./production-qa.css";
import "./route-experience.css";
import "./status-pages.css";
import "./media-placeholders.css";
import "./page-hero-identities.css";
import "./pending-states.css";
import "./control-system.css";
import "./launch-polish.css";
import "./subtle-radius.css";
import { Footer, Header } from "@/components/layout";
import { RouteExperience } from "@/components/route-experience";
import { WebVitals } from "@/components/web-vitals";
import { ConversationProvider } from "@/components/conversation-modal";
import { getCmsContent } from "@/lib/cms/content";
import { getSiteOrigin } from "@/lib/site-url";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = getSiteOrigin();
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
  icons: {
    icon: {
      url: "/AUREUM%2032%20X%2032.png",
      sizes: "32x32",
      type: "image/png",
    },
    shortcut: "/AUREUM%2032%20X%2032.png",
  },
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const footerContent = await getCmsContent("site.footer");
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={manrope.variable} suppressHydrationWarning>
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
        <ConversationProvider>
          <Header />
          <RouteExperience>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <Footer content={footerContent} />
          </RouteExperience>
        </ConversationProvider>
        <WebVitals />
      </body>
    </html>
  );
}
