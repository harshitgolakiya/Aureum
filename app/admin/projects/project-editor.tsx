"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CmsWorkflowStatus, Project } from "@/data/site";
import { PROJECT_CHAPTERS, slugifyProject, type ProjectChapterKey } from "@/lib/cms/project-validation";
import { checkProjectSlugAction, saveProjectEditorAction, type ProjectEditorResult } from "./editor-actions";
import { MediaPicker } from "../media/media-picker";
import { SeoControls } from "../seo-controls";
import { formatDubaiDateTimeLocal } from "@/lib/cms/scheduling";

const chapterLabels: Record<ProjectChapterKey, string> = {
  opportunity: "The Opportunity",
  strategy: "The Strategy",
  delivery: "The Delivery",
  outcome: "The Outcome",
};

function initialChapterOrder(project?: Project) {
  const supplied = project?.chapterOrder.split(",").filter((item): item is ProjectChapterKey => PROJECT_CHAPTERS.includes(item as ProjectChapterKey)) ?? [];
  return [...new Set([...supplied, ...PROJECT_CHAPTERS])];
}

export function ProjectEditor({ project, redirects = [] }: { project?: Project & { lockVersion?: number }; redirects?: Array<{ oldSlug: string; createdAt: string }> }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [currentSlug, setCurrentSlug] = useState(project?.slug ?? "");
  const [name, setName] = useState(project?.name ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugAutomatic, setSlugAutomatic] = useState(!project);
  const [slugStatus, setSlugStatus] = useState("");
  const [coverImage, setCoverImage] = useState(project?.coverImage ?? "/media/heroes/portfolio.webp");
  const [gallery, setGallery] = useState(() => project?.galleryImages.split(/\r?\n/).filter(Boolean) ?? []);
  const [galleryDraft, setGalleryDraft] = useState("");
  const [chapters, setChapters] = useState<ProjectChapterKey[]>(() => initialChapterOrder(project));
  const [dirty, setDirty] = useState(false);
  const [published, setPublished] = useState(project?.published ?? false);
  const [workflowStatus, setWorkflowStatus] = useState<CmsWorkflowStatus>(project?.workflowStatus ?? "draft");
  const [result, setResult] = useState<ProjectEditorResult>({ ok: true });
  const [lockVersion, setLockVersion] = useState(project?.lockVersion ?? 0);

  const submit = useCallback((intent: "autosave" | "draft" | "save" | "publish" | "schedule") => {
    const form = formRef.current;
    if (!form || isPending) return;
    const formData = new FormData(form);
    formData.set("intent", intent);
    formData.set("originalSlug", currentSlug);
    formData.set("lockVersion", String(lockVersion));
    formData.set("slug", slug);
    formData.set("galleryImages", gallery.join("\n"));
    formData.set("chapterOrder", chapters.join(","));
    startTransition(async () => {
      const response = await saveProjectEditorAction(formData);
      setResult(response);
      if (!response.ok || !response.slug) return;
      const wasNew = !currentSlug;
      setCurrentSlug(response.slug);
      setSlug(response.slug);
      setPublished(Boolean(response.published));
      if (response.workflowStatus) setWorkflowStatus(response.workflowStatus);
      if (response.lockVersion !== undefined) setLockVersion(response.lockVersion);
      setDirty(false);
      if (wasNew || response.slug !== currentSlug) {
        router.replace(`/admin/projects/${response.slug}`);
      } else if (intent !== "autosave") {
        router.refresh();
      }
    });
  }, [chapters, currentSlug, gallery, isPending, lockVersion, router, slug]);

  useEffect(() => {
    if (!dirty || published || isPending || (!name.trim() && !slug.trim())) return;
    const timer = window.setTimeout(() => submit("autosave"), 15000);
    return () => window.clearTimeout(timer);
  }, [dirty, isPending, name, published, slug, submit]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function moveChapter(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    setChapters((items) => {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  function moveGallery(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    setGallery((items) => {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  async function checkSlug() {
    const response = await checkProjectSlugAction(slug, currentSlug);
    if (response.slug !== slug) setSlug(response.slug);
    setSlugStatus(response.message);
  }

  const errors = result.errors ?? {};
  const saveIntent = workflowStatus === "published" || workflowStatus === "scheduled" || workflowStatus === "unpublished" ? "save" : "draft";
  const statusLabel = workflowStatus[0].toUpperCase() + workflowStatus.slice(1);

  return (
    <form
      className="cms-project-editor"
      ref={formRef}
      onChange={() => setDirty(true)}
      onSubmit={(event) => { event.preventDefault(); submit(saveIntent); }}
    >
      <input type="hidden" name="originalSlug" value={currentSlug} />
      <input type="hidden" name="lockVersion" value={lockVersion} />
      <input type="hidden" name="chapterOrder" value={chapters.join(",")} />
      <input type="hidden" name="galleryImages" value={gallery.join("\n")} />

      <aside className="cms-editor-outline">
        <p>Project content</p>
        <a href="#overview">Overview</a><a href="#details">Details</a><a href="#story">Story</a><a href="#media">Media</a><a href="#seo">SEO</a><a href="#publishing">Publishing</a>
        <div><span className={`cms-record-status is-${workflowStatus}`}><i />{statusLabel}</span><small>{dirty ? "Unsaved changes" : result.savedAt ? `Saved ${new Date(result.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "All changes saved"}</small></div>
      </aside>

      <div className="cms-editor-canvas">
        {result.message && <div className={`cms-alert ${result.ok ? "cms-alert-success" : "cms-alert-error"}`}>{result.message}</div>}
        <EditorSection id="overview" number="01" title="Overview" copy="The core identity used in listings, URLs, and project introductions.">
          <EditorField label="Project name" name="name" value={name} error={errors.name} wide onChange={(value) => { setName(value); if (slugAutomatic) setSlug(slugifyProject(value)); }} />
          <label className="cms-editor-field is-wide"><span>Slug <small>Lowercase URL identifier</small></span><div className="cms-slug-control"><span>/portfolio/</span><input name="slug" value={slug} onChange={(event) => { setSlug(event.target.value); setSlugAutomatic(false); setSlugStatus(""); }} onBlur={checkSlug} /></div>{errors.slug && <em>{errors.slug}</em>}{!errors.slug && slugStatus && <small className="cms-field-note">{slugStatus}</small>}</label>
          <EditorField label="Listing summary" name="philosophy" value={project?.philosophy} error={errors.philosophy} textarea wide />
        </EditorSection>

        <EditorSection id="details" number="02" title="Project details" copy="Commercial and development information shown across the portfolio.">
          <EditorField label="Location" name="location" value={project?.location} error={errors.location} />
          <EditorField label="Asset type" name="type" value={project?.type} error={errors.type} />
          <EditorField label="Category" name="category" value={project?.category} error={errors.category} list="project-categories" />
          <datalist id="project-categories"><option value="Logistics" /><option value="Industrial Parks" /><option value="Distribution" /><option value="Mixed-Use" /></datalist>
          <EditorField label="Defining metric" name="metric" value={project?.metric} error={errors.metric} />
          <EditorField label="Development status" name="status" value={project?.status} error={errors.status} />
          <EditorField label="Engagement model" name="engagement" value={project?.engagement} error={errors.engagement} />
        </EditorSection>

        <EditorSection id="story" number="03" title="Case-study story" copy="Reorder the chapters and write the narrative shown on the project detail page.">
          <div className="cms-chapter-editor is-wide">
            {chapters.map((chapter, index) => (
              <article key={chapter}>
                <header><span>{String(index + 1).padStart(2, "0")}</span><strong>{chapterLabels[chapter]}</strong><div><button type="button" onClick={() => moveChapter(index, -1)} disabled={index === 0} aria-label={`Move ${chapterLabels[chapter]} up`}>↑</button><button type="button" onClick={() => moveChapter(index, 1)} disabled={index === chapters.length - 1} aria-label={`Move ${chapterLabels[chapter]} down`}>↓</button></div></header>
                <textarea aria-label={`${chapterLabels[chapter]} content`} name={chapter} defaultValue={project?.[chapter]} rows={7} />
                {errors[chapter] && <em>{errors[chapter]}</em>}
              </article>
            ))}
          </div>
        </EditorSection>

        <EditorSection id="media" number="04" title="Media" copy="Choose optimized assets from the media library or enter an existing public asset path.">
          <label className="cms-editor-field is-wide"><span>Cover image</span><div className="cms-cover-editor"><div>{coverImage.startsWith("/") && <Image src={coverImage} alt="" fill sizes="180px" />}</div><span><input name="coverImage" value={coverImage} onChange={(event) => setCoverImage(event.target.value)} /><MediaPicker onSelect={(asset) => { setCoverImage(asset.publicPath); setDirty(true); }} /></span></div>{errors.coverImage && <em>{errors.coverImage}</em>}</label>
          <div className="cms-gallery-editor is-wide">
            <div className="cms-gallery-add"><input aria-label="Gallery image path" value={galleryDraft} onChange={(event) => setGalleryDraft(event.target.value)} placeholder="/media/projects/gallery-image.webp" /><button type="button" onClick={() => { const path = galleryDraft.trim(); if (!path) return; setGallery((items) => [...items, path]); setGalleryDraft(""); setDirty(true); }}>Add path</button><MediaPicker label="Choose media" onSelect={(asset) => { setGallery((items) => [...items, asset.publicPath]); setDirty(true); }} /></div>
            {errors.galleryImages && <em>{errors.galleryImages}</em>}
            <div>{gallery.map((item, index) => <article key={`${item}-${index}`}><div>{item.startsWith("/") && <Image src={item} alt="" fill sizes="120px" />}</div><p>{item}</p><span><button type="button" onClick={() => moveGallery(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => moveGallery(index, 1)} disabled={index === gallery.length - 1}>↓</button><button type="button" onClick={() => { setGallery((items) => items.filter((_, itemIndex) => itemIndex !== index)); setDirty(true); }}>Remove</button></span></article>)}</div>
            {!gallery.length && <p className="cms-gallery-empty">No gallery images added yet.</p>}
          </div>
        </EditorSection>

        <EditorSection id="seo" number="05" title="SEO" copy="Control search visibility and preview exactly how this project appears in search and social sharing.">
          <SeoControls initial={project} fallbackTitle={name} fallbackDescription={project?.philosophy ?? ""} fallbackImage={coverImage} route={`/portfolio/${slug || "project-slug"}`} errors={errors} redirects={redirects} />
        </EditorSection>

        <EditorSection id="publishing" number="06" title="Publishing" copy="Drafts can be incomplete. Publishing requires every essential project field.">
          <EditorField label="Display order" name="sortOrder" value={project?.sortOrder ?? 0} type="number" />
          <EditorField label="Schedule publication — Dubai time (GST)" name="scheduledAt" value={formatDubaiDateTimeLocal(project?.scheduledAt)} error={errors.scheduledAt} type="datetime-local" />
          <div className="cms-publish-summary is-wide"><span className={`cms-record-status is-${workflowStatus}`}><i />{statusLabel}</span><p>{published ? "Saving changes updates the public project immediately." : workflowStatus === "scheduled" ? "This project will publish automatically at the scheduled time." : "Autosave runs after 15 seconds of inactivity. Non-published projects are hidden from the public website."}</p></div>
        </EditorSection>
      </div>

      <footer className="cms-editor-actionbar">
        <div>{isPending ? "Saving…" : dirty ? "You have unsaved changes" : result.message ?? "Ready"}</div>
        <div>
          <Link href="/admin/projects">Cancel</Link>
          {currentSlug && <Link href={`/admin/projects/${currentSlug}/preview`} target="_blank">Preview</Link>}
          {currentSlug && <Link href={`/admin/projects/${currentSlug}/revisions`}>Revisions</Link>}
          <button className="is-secondary" type="button" disabled={isPending} onClick={() => submit(saveIntent)}>{published ? "Save changes" : "Save draft"}</button>
          <button className="is-secondary" type="button" disabled={isPending} onClick={() => submit("schedule")}>Schedule</button>
          <button type="button" disabled={isPending} onClick={() => submit("publish")}>{published ? "Update publication" : "Publish project"}</button>
        </div>
      </footer>
    </form>
  );
}

function EditorSection({ id, number, title, copy, children }: { id: string; number: string; title: string; copy: string; children: React.ReactNode }) {
  return <section className="cms-editor-section" id={id}><header><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></header><div className="cms-editor-grid">{children}</div></section>;
}

function EditorField({ label, name, value = "", error, textarea = false, wide = false, type = "text", list, onChange }: {
  label: string; name: string; value?: string | number; error?: string; textarea?: boolean; wide?: boolean; type?: "text" | "number" | "datetime-local"; list?: string; onChange?: (value: string) => void;
}) {
  return <label className={`cms-editor-field ${wide ? "is-wide" : ""}`}><span>{label}</span>{textarea ? <textarea name={name} defaultValue={value} rows={5} /> : onChange ? <input name={name} type={type} value={value} list={list} onChange={(event) => onChange(event.target.value)} /> : <input name={name} type={type} defaultValue={value} list={list} />}{error && <em>{error}</em>}</label>;
}
