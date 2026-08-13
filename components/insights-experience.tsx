"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Media } from "./ui";
import { insightArticles, insightPresentation } from "@/data/site";

gsap.registerPlugin(ScrollTrigger);
const categoryCopy = [
  [
    "01",
    "Market Intelligence",
    "Data-driven analysis of UAE and regional industrial market trends. Supply and demand dynamics, rental performance, occupancy trends, investment flows and emerging corridors. Quarterly market reports and annual outlook publications.",
  ],
  [
    "02",
    "Industry Perspectives",
    "Expert commentary on the forces shaping industrial development. Government policy, logistics innovation, supply chain transformation, sustainability requirements and technology adoption. Written by Aureum's leadership team.",
  ],
  [
    "03",
    "Thought Leadership",
    "Strategic perspectives on the future of industrial development. Long-form editorial exploring how intelligence, governance and integrated thinking create competitive advantage. Positions Aureum as the intellectual leader in the sector.",
  ],
] as const;

export function InsightsLanding() {
  const [filter, setFilter] = useState("All");
  const [featured, setFeatured] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const filters = [
    "All",
    "Market Intelligence",
    "Industry Perspective",
    "Thought Leadership",
  ];
  const visible =
    filter === "All"
      ? insightArticles
      : insightArticles.filter((article) => article.category === filter);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from(".insight-category", {
        opacity: 0,
        y: 45,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: ".insight-categories", start: "top 80%" },
      });
    }, root);
    return () => context.revert();
  }, []);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      ".insight-result",
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: "power3.out" },
    );
  }, [filter]);
  const article = insightArticles[featured];
  return (
    <div ref={root}>
      <section className="featured-insight">
        <div className="featured-insight-media" data-cursor="Explore">
          <Media label={`insight-featured-0${featured + 1}.webp`} />
          <div className="featured-index">0{featured + 1} / 03</div>
        </div>
        <div className="featured-insight-copy">
          <small>Featured / {article.category}</small>
          <h2>{insightPresentation(article, featured).title}</h2>
          <p>{insightPresentation(article, featured).excerpt}</p>
          <div>
            <span>
              {insightPresentation(article, featured).readTime} ·{" "}
              {insightPresentation(article, featured).date}
            </span>
            <Link href={`/insights/${article.slug}`}>
              Read featured insight ↗
            </Link>
          </div>
          <nav aria-label="Choose featured insight">
            {insightArticles.map((item, index) => (
              <button
                aria-label={`Feature ${insightPresentation(item, index).title}`}
                aria-pressed={featured === index}
                className={featured === index ? "active" : ""}
                onClick={() => setFeatured(index)}
                key={item.slug}
              >
                0{index + 1}
              </button>
            ))}
          </nav>
        </div>
      </section>
      <section className="insight-categories">
        {categoryCopy.map(([n, title, body]) => (
          <article className="insight-category" key={n}>
            <span>{n}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
      <section className="insight-library">
        <div className="insight-filter">
          <div>
            <small>Insight Library</small>
            <strong>
              {visible.length.toString().padStart(2, "0")} /{" "}
              {insightArticles.length.toString().padStart(2, "0")}
            </strong>
          </div>
          <div role="group" aria-label="Filter insights">
            {filters.map((item) => (
              <button
                className={filter === item ? "active" : ""}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="insight-results" aria-live="polite">
          {visible.map((item, index) => (
            <Link
              className="insight-result"
              href={`/insights/${item.slug}`}
              key={item.slug}
            >
              <span>0{index + 1}</span>
              <div>
                <small>{item.category}</small>
                <h2>{insightPresentation(item).title}</h2>
                <p>{insightPresentation(item).excerpt}</p>
              </div>
              <div>
                <small>
                  {insightPresentation(item).readTime}
                  <br />
                  {insightPresentation(item).date}
                </small>
                <b>Read ↗</b>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ArticleExperience({ slug }: { slug: string }) {
  const article = insightArticles.find((item) => item.slug === slug)!;
  const index = insightArticles.findIndex((item) => item.slug === slug);
  const display = insightPresentation(article, index);
  const next = insightArticles[(index + 1) % insightArticles.length];
  const root = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const update = () => {
      if (!root.current) return;
      const rect = root.current.getBoundingClientRect();
      const distance = root.current.offsetHeight - innerHeight;
      setProgress(Math.max(0, Math.min(1, -rect.top / distance)));
    };
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);
  async function copy() {
    await navigator.clipboard?.writeText(location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <article ref={root} className="insight-article">
      <div className="reading-progress">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
      <header className="article-header">
        <small>
          {article.category} / {display.date} / {display.readTime}
        </small>
        <h1>{display.title}</h1>
        <p>{display.excerpt}</p>
      </header>
      <Media label="article-hero.webp" />
      <div className="article-layout">
        <aside>
          <div className="article-author">
            <div className="author-placeholder">A</div>
            <p>
              {display.author}
              <small>{display.authorTitle}</small>
            </p>
          </div>
          <div className="article-share">
            <small>Share article</small>
            <button onClick={copy}>
              {copied ? "Link copied" : "Copy link"}
            </button>
            <a href={`mailto:?subject=${encodeURIComponent(display.title)}`}>
              Email
            </a>
          </div>
        </aside>
        <div className="article-content">
          <p className="article-intro">
            Article content has not yet been supplied. This reading template is
            ready for approved Aureum insight content.
          </p>
          <h2>Article content pending</h2>
          <p>
            The approved long-form article body will appear here. The content
            system supports editorial text, supporting imagery, pull quotes and
            data visualisations without changing the reading layout.
          </p>
          <blockquote>“Approved pull quote pending.”</blockquote>
          <div className="data-placeholder">
            <span>Data visualisation</span>
            <div>
              <i />
              <i />
              <i />
              <i />
            </div>
            <small>Approved dataset and source pending</small>
          </div>
          <h2>Supporting perspective</h2>
          <p>
            Related analysis, cited market evidence and Aureum&apos;s approved
            perspective will be placed here once supplied. No market statistics
            or claims have been invented.
          </p>
        </div>
      </div>
      <section className="related-insights">
        <small>Related Insights</small>
        <div>
          {insightArticles
            .filter((item) => item.slug !== slug)
            .map((item) => (
              <Link href={`/insights/${item.slug}`} key={item.slug}>
                <span>{item.category}</span>
                <h3>{insightPresentation(item).title}</h3>
                <b>Read insight ↗</b>
              </Link>
            ))}
        </div>
      </section>
      <Link className="next-insight" href={`/insights/${next.slug}`}>
        <small>Continue reading / {next.category}</small>
        <h2>{insightPresentation(next).title}</h2>
        <span>Next insight →</span>
      </Link>
    </article>
  );
}
