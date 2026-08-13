"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Media } from "./ui";
import { projectPresentation, projects } from "@/data/site";

gsap.registerPlugin(ScrollTrigger);
const filters = [
  "All",
  "Logistics",
  "Industrial Parks",
  "Distribution",
  "Mixed-Use",
];

export function PortfolioListing() {
  const [filter, setFilter] = useState("All");
  const grid = useRef<HTMLDivElement>(null);
  const visible =
    filter === "All"
      ? projects
      : projects.filter((project) => project.category === filter);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!grid.current) return;
    gsap.fromTo(
      grid.current.children,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.65, ease: "power3.out" },
    );
  }, [filter]);
  return (
    <section className="portfolio-explore">
      <div className="portfolio-filter-bar">
        <div>
          <small>All Developments</small>
          <strong>
            {visible.length.toString().padStart(2, "0")} /{" "}
            {projects.length.toString().padStart(2, "0")}
          </strong>
        </div>
        <div role="group" aria-label="Filter developments">
          {filters.map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <p className="portfolio-intro">
        Each development contributes another perspective on how intelligent
        industrial development creates value. Together they reflect the
        consistency of thinking that defines Aureum&apos;s work.
      </p>
      <div ref={grid} className="portfolio-editorial-grid" aria-live="polite">
        {visible.map((project, index) => {
          const display = projectPresentation(project);
          return (
            <Link
              className={index % 3 === 0 ? "project-wide" : ""}
              href={`/portfolio/${project.slug}`}
              key={project.slug}
            >
              <div className="portfolio-media" data-cursor="View">
                <Media label={`portfolio-${project.slug}.webp`} />
                <span className="project-view">View</span>
              </div>
              <div className="portfolio-card-meta">
                <small>
                  {project.category} / {display.location}
                </small>
                <span>{display.status}</span>
              </div>
              <h2>{display.name}</h2>
              <p>{display.philosophy}</p>
              <div className="portfolio-metric">
                <span>{display.metric}</span>
                <b>View full case study ↗</b>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const chapters = [
  [
    "01",
    "The Opportunity",
    "Approved opportunity context and strategic rationale pending.",
  ],
  [
    "02",
    "The Strategy",
    "Approved account of the intelligence, commercial priorities and development strategy pending.",
  ],
  [
    "03",
    "The Delivery",
    "Approved delivery, governance and milestone narrative pending.",
  ],
  [
    "04",
    "The Outcome",
    "Approved results, performance measures and evidence of value creation pending.",
  ],
] as const;

export function CaseStudyExperience({ slug }: { slug: string }) {
  const project = projects.find((item) => item.slug === slug)!;
  const index = projects.findIndex((item) => item.slug === slug);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.utils
        .toArray<HTMLElement>(".case-chapter")
        .forEach((chapter, chapterIndex) =>
          ScrollTrigger.create({
            trigger: chapter,
            start: "top 40%",
            end: "bottom 40%",
            onToggle: (self) => {
              if (self.isActive) setActive(chapterIndex);
            },
          }),
        );
      gsap.from(".case-gallery > button", {
        opacity: 0,
        y: 45,
        stagger: 0.08,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: ".case-gallery", start: "top 80%" },
      });
    }, root);
    return () => context.revert();
  }, []);
  useEffect(() => {
    if (lightbox === null) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((lightbox + 1) % 6);
      if (event.key === "ArrowLeft") setLightbox((lightbox + 5) % 6);
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(".lightbox");
        const focusable = dialog?.querySelectorAll<HTMLElement>("button");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [lightbox]);
  return (
    <div ref={root}>
      <div className="case-progress">
        <span style={{ width: `${((active + 1) / 4) * 100}%` }} />
      </div>
      <section className="case-overview">
        <aside>
          <small>Development / {project.category}</small>
          <h2>Key metrics</h2>
          {[
            ["Total GFA", "Pending approval"],
            ["Development Period", "Pending approval"],
            ["Occupancy", "Pending approval"],
            ["Asset Type", project.type],
            ["Engagement Model", "Pending approval"],
          ].map(([label, value]) => (
            <p key={label}>
              {label}
              <b>{value}</b>
            </p>
          ))}
        </aside>
        <div className="case-chapters">
          <nav aria-label="Case study chapters">
            {chapters.map(([n, title], chapterIndex) => (
              <a
                className={active === chapterIndex ? "active" : ""}
                href={`#chapter-${n}`}
                key={n}
              >
                <span>{n}</span>
                {title}
              </a>
            ))}
          </nav>
          {chapters.map(([n, title, body], chapterIndex) => (
            <article id={`chapter-${n}`} className="case-chapter" key={n}>
              <div className={`case-chapter-visual visual-${chapterIndex + 1}`}>
                <span>{n}</span>
                <i />
                <i />
              </div>
              <small>{n} / 04</small>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="case-gallery-section">
        <div>
          <small>Development Gallery</small>
          <h2>From masterplan to operation.</h2>
          <p>
            Six approved project images will document aerial scale,
            architecture, interiors, operations, masterplanning and engineering
            detail.
          </p>
        </div>
        <div className="case-gallery">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <button
              data-cursor="Open"
              key={item}
              onClick={() => setLightbox(item)}
              aria-label={`Open gallery placeholder ${item + 1}`}
            >
              <Media label={`project-gallery-0${item + 1}.webp`} />
              <span>0{item + 1}</span>
            </button>
          ))}
        </div>
      </section>
      <nav className="project-pagination" aria-label="Other developments">
        <Link href={`/portfolio/${previous.slug}`}>
          <small>Previous development</small>
          <strong>{previous.name}</strong>
          <span>←</span>
        </Link>
        <Link href={`/portfolio/${next.slug}`}>
          <small>Next development</small>
          <strong>{next.name}</strong>
          <span>→</span>
        </Link>
      </nav>
      {lightbox !== null && (
        <div
          className="lightbox"
          data-cursor="Close"
          role="dialog"
          aria-modal="true"
          aria-label={`Gallery image ${lightbox + 1} of 6`}
        >
          <button
            className="lightbox-close"
            onClick={() => setLightbox(null)}
            autoFocus
          >
            Close ×
          </button>
          <button
            className="lightbox-prev"
            onClick={() => setLightbox((lightbox + 5) % 6)}
            aria-label="Previous image"
          >
            ←
          </button>
          <Media label={`project-gallery-0${lightbox + 1}.webp`} />
          <button
            className="lightbox-next"
            onClick={() => setLightbox((lightbox + 1) % 6)}
            aria-label="Next image"
          >
            →
          </button>
          <p>0{lightbox + 1} / 06 &nbsp; Project photography pending</p>
        </div>
      )}
    </div>
  );
}
