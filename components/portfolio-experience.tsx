"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Media } from "./ui";
import { projectPresentation, type Project } from "@/data/site";

gsap.registerPlugin(ScrollTrigger);
export function PortfolioListing({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("All");
  const grid = useRef<HTMLDivElement>(null);
  const filters = ["All", ...new Set(projects.map((project) => project.category))];
  const visible =
    filter === "All"
      ? projects
      : projects.filter((project) => project.category === filter);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!grid.current) return;
    const cards = Array.from(grid.current.children);
    if (!cards.length) return;
    gsap.fromTo(
      cards,
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
                <Media label={`portfolio-${project.slug}.webp`} src={project.coverImage} alt={display.name} />
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

export function CaseStudyExperience({ project, projects }: { project: Project; projects: Project[] }) {
  const index = projects.findIndex((item) => item.slug === project.slug);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const root = useRef<HTMLDivElement>(null);
  const galleryTrigger = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const chapterContent = {
    opportunity: ["The Opportunity", project.opportunity],
    strategy: ["The Strategy", project.strategy],
    delivery: ["The Delivery", project.delivery],
    outcome: ["The Outcome", project.outcome],
  } as const;
  const chapterKeys = project.chapterOrder
    .split(",")
    .filter((key): key is keyof typeof chapterContent => key in chapterContent);
  const chapters = [...new Set([...chapterKeys, ...Object.keys(chapterContent) as Array<keyof typeof chapterContent>])]
    .map((key, chapterIndex) => [String(chapterIndex + 1).padStart(2, "0"), ...chapterContent[key]] as const);
  const galleryImages = project.galleryImages.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const galleryCount = galleryImages.length || 6;
  function closeLightbox() {
    setLightbox(null);
    setTimeout(() => galleryTrigger.current?.focus(), 0);
  }
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
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") setLightbox((lightbox + 1) % galleryCount);
      if (event.key === "ArrowLeft") setLightbox((lightbox + galleryCount - 1) % galleryCount);
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
  }, [lightbox, galleryCount]);
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
            ["Defining metric", project.metric],
            ["Status", project.status],
            ["Asset Type", project.type],
            ["Engagement Model", project.engagement],
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
            Explore the development through approved project photography and
            supporting visual documentation.
          </p>
        </div>
        <div className="case-gallery">
          {Array.from({ length: galleryCount }, (_, item) => (
            <button
              data-cursor="Open"
              key={item}
              onClick={(event) => {
                galleryTrigger.current = event.currentTarget;
                setLightbox(item);
              }}
              aria-label={`Open gallery placeholder ${item + 1}`}
            >
              <Media label={`project-gallery-0${item + 1}.webp`} src={galleryImages[item]} alt={`${project.name} gallery image ${item + 1}`} />
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
          aria-describedby="gallery-lightbox-caption"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            autoFocus
          >
            Close ×
          </button>
          <button
            className="lightbox-prev"
            onClick={() => setLightbox((lightbox + galleryCount - 1) % galleryCount)}
            aria-label="Previous image"
          >
            ←
          </button>
          <Media label={`project-gallery-0${lightbox + 1}.webp`} src={galleryImages[lightbox]} alt={`${project.name} gallery image ${lightbox + 1}`} />
          <button
            className="lightbox-next"
            onClick={() => setLightbox((lightbox + 1) % galleryCount)}
            aria-label="Next image"
          >
            →
          </button>
          <p id="gallery-lightbox-caption">
            {String(lightbox + 1).padStart(2, "0")} / {String(galleryCount).padStart(2, "0")} &nbsp; {project.name}
          </p>
        </div>
      )}
    </div>
  );
}
