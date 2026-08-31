import Link from "next/link";
import { ArrowLink, Connect, Eyebrow, Media } from "@/components/ui";
import {
  insightPresentation,
  projectPresentation,
} from "@/data/site";
import {
  AureumSystemIntroduction,
  EngagementModels,
  HomeHero,
  HomepageReveals,
  LifecycleStory,
} from "@/components/home-experience";
import { AureumSequenceStory } from "@/components/aureum-sequence-story";
import type { Metadata } from "next";
import { getCmsContent } from "@/lib/cms/content";
import { getPosts, getProjects } from "@/lib/cms/collections";

export const metadata: Metadata = {
  title: "The 360° Industrial Developer",
  description:
    "Aureum brings intelligence, strategy and disciplined execution together to shape industrial opportunities into enduring developments.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [heroContent, projects, insightArticles] = await Promise.all([
    getCmsContent("home.hero"),
    getProjects(),
    getPosts(),
  ]);
  return (
    <main>
      <HomeHero content={heroContent} />
      <AureumSystemIntroduction />
      <AureumSequenceStory />
      <LifecycleStory />
      <EngagementModels />
      <section className="work section">
        <div className="section-heading">
          <Eyebrow>Selected Developments</Eyebrow>
          <h2>
            Every development reflects the <em>thinking behind it...</em>
          </h2>
          <p>
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
              <Media label={`portfolio-project-0${i + 1}.webp`} src={p.coverImage} alt={projectPresentation(p, i).name} />
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
          <Eyebrow>Intelligence</Eyebrow>
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
              <small>{article.category}</small>
              <h3>{insightPresentation(article, i).title}</h3>
              <p>{insightPresentation(article, i).excerpt}</p>
              <b>Read article ↗</b>
            </Link>
          ))}
        </div>
        <div className="insights-cta">
          <ArrowLink href="/insights" dark>
            View All News
          </ArrowLink>
        </div>
      </section>
      <Connect compact />
      <HomepageReveals />
    </main>
  );
}
