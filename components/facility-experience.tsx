"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/data/site";
import { Media } from "./ui";

export function ProjectHero({ project }: { project: Project }) {
  return <section className={`case-hero${project.coverImage ? "" : " case-hero-without-image"}`}>
    {project.coverImage && <Media label="project-hero.webp" src={project.coverImage} alt={project.name} />}
    <div><small>{[project.location, project.category].filter(Boolean).join(" / ")}</small><h1>{project.details?.headline || project.name}</h1>{project.details && <p className="facility-offering">{project.details.offering}</p>}<p>{project.philosophy}</p></div>
  </section>;
}

export function FacilityExperience({ project, projects }: { project: Project; projects: Project[] }) {
  const details = project.details!;
  const others = projects.filter((item) => item.slug !== project.slug);
  return <div className="facility-experience">
    <section className="facility-specs section" aria-labelledby="facility-specs-title">
      <div><p className="eyebrow">{project.name}</p><h2 id="facility-specs-title">Facility specifications</h2><p>{project.status} · {project.engagement}</p></div>
      <dl>{details.specifications.map((spec, index) => <div key={`${spec.label}-${index}`}><dt>{spec.label}</dt><dd>{spec.value}</dd>{spec.note && <dd className="facility-spec-note">{spec.note}</dd>}</div>)}</dl>
    </section>
    {Boolean(details.features.filter((item) => item.trim()).length) && <section className="facility-features section"><p className="eyebrow">Built around your business</p><h2>{details.featuresTitle || "Key features"}</h2><ul>{details.features.filter((item) => item.trim()).map((feature, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span>{feature}</li>)}</ul></section>}
    {Boolean(details.sectors.filter((item) => item.trim()).length) && <section className="facility-sectors section"><h2>Designed for</h2><ul>{details.sectors.filter((item) => item.trim()).map((sector, index) => <li key={index}>{sector}</li>)}</ul></section>}
    {details.sections.length > 0 && <section className="facility-sections section">{details.sections.map((section, index) => <article key={index}><small>{String(index + 1).padStart(2, "0")}</small><h2>{section.title}</h2>{section.body.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</article>)}</section>}
    <FacilityGallery project={project} />
    {others.length > 0 && <nav className="project-pagination" aria-label="Other facilities">{others.slice(0, 2).map((item) => <Link key={item.slug} href={`/portfolio/${item.slug}`}><small>Explore another facility</small><strong>{item.name}</strong><span>→</span></Link>)}</nav>}
  </div>;
}

function FacilityGallery({ project }: { project: Project }) {
  const images = project.galleryImages.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (active === null) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = before; };
  }, [active]);
  if (!images.length) return null;
  function close() { setActive(null); trigger.current?.focus(); }
  return <section className="facility-gallery section"><h2>Facility gallery</h2>{project.details?.imageCaption && <p>{project.details.imageCaption}</p>}<div className="case-gallery">{images.map((src, index) => <button type="button" key={`${src}-${index}`} onClick={(event) => { trigger.current = event.currentTarget; setActive(index); }} aria-label={`View ${project.name} image ${index + 1}`}><Media label="facility-gallery.webp" src={src} alt={`${project.name}, image ${index + 1}`} /></button>)}</div><dialog className="facility-lightbox" ref={dialog} onCancel={close} onClose={close} aria-label={`${project.name} photography`} onKeyDown={(event) => { if (active === null) return; if (event.key === "ArrowRight") setActive((active + 1) % images.length); if (event.key === "ArrowLeft") setActive((active + images.length - 1) % images.length); }}><button type="button" onClick={close} autoFocus>Close ×</button>{active !== null && <><div><Image src={images[active]} alt={`${project.name}, image ${active + 1}`} fill sizes="90vw" /></div><nav><button type="button" onClick={() => setActive((active + images.length - 1) % images.length)}>← Previous</button><span>{active + 1} / {images.length}</span><button type="button" onClick={() => setActive((active + 1) % images.length)}>Next →</button></nav></>}</dialog></section>;
}
