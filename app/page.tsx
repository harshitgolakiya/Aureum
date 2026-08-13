import Link from "next/link";
import { ArrowLink, Connect, Eyebrow, Media } from "@/components/ui";
import {
  insightArticles,
  insightPresentation,
  projectPresentation,
  projects,
} from "@/data/site";
import {
  AureumSystemIntroduction,
  AureumSystemStory,
  EngagementModels,
  HomeHero,
  HomepageReveals,
  LifecycleStory,
} from "@/components/home-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The 360° Industrial Developer",
  description:
    "Aureum brings intelligence, strategy and disciplined execution together to shape industrial opportunities into enduring developments.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main>
      <HomeHero />
      <AureumSystemIntroduction />
      <AureumSystemStory />
      <LifecycleStory />
      <EngagementModels />
      <section className="work section">
        <div className="section-heading">
          <Eyebrow>04 / Selected Developments</Eyebrow>
          <h2>
            Every development reflects the <em>thinking behind it...</em>
          </h2>
          <p>
            From the opportunity identified to the decisions that shape its
            performance.
            <br />
            <br />
            Explore the developments that demonstrate Aureum&apos;s approach in
            practice.
          </p>
        </div>
        <div className="project-grid">
          {projects.map((p, i) => (
            <Link
              href={`/portfolio/${p.slug}`}
              className={i === 0 ? "featured" : ""}
              key={p.slug}
            >
              <Media label={`portfolio-project-0${i + 1}.webp`} />
              <span>
                {p.type} · {projectPresentation(p, i).location}
              </span>
              <h3>{projectPresentation(p, i).name}</h3>
              <b>View development ↗</b>
            </Link>
          ))}
        </div>
        <ArrowLink href="/portfolio" dark>
          View All Developments
        </ArrowLink>
      </section>
      <section className="insights section">
        <div className="section-heading">
          <Eyebrow>05 / Intelligence</Eyebrow>
          <h2>
            Insight creates advantage <em>before action.</em>
          </h2>
          <p>
            Aureum&apos;s perspectives bring clarity to the shifts,
            opportunities and forces shaping industrial development.
          </p>
        </div>
        <div className="article-list">
          {insightArticles.map((article, i) => (
            <Link href={`/insights/${article.slug}`} key={article.slug}>
              <span>0{i + 1}</span>
              <small>
                {
                  [
                    "Market Intelligence",
                    "Industry Perspective",
                    "Thought Leadership",
                  ][i]
                }
              </small>
              <h3>{insightPresentation(article, i).title}</h3>
              <p>Two-line summary of the article’s key perspective</p>
              <b>Read article ↗</b>
            </Link>
          ))}
        </div>
        <div className="insights-cta">
          <ArrowLink href="/insights" dark>
            View All Insights
          </ArrowLink>
        </div>
      </section>
      <Connect />
      <HomepageReveals />
    </main>
  );
}
