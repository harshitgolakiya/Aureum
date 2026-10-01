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
import { emptyProjectDetails } from "@/data/project-details";
import { FacilityFields } from "./facility-fields";

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
  const [coverImage, setCoverImage] = useState(project?.coverImage ?? "");
  const [facility, setFacility] = useState(Boolean(project?.details) || !project);
  const [details, setDetails] = useState(project?.details ?? emptyProjectDetails());
  const [homepageImage, setHomepageImage] = useState(project?.homepageImage ?? "");
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
      autoComplete="off"
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
        <a href="#overview">Overview</a><a href="#details">Details</a><a href="#story">Story</a><a href="#media">Media</a><a href="#homepage">Homepage</a><a href="#seo">SEO</a><a href="#publishing">Publishing</a>
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
          <datalist id="project-categories"><option value="Trading & Logistics" /><option value="Commercial Office" /><option value="Logistics" /><option value="Industrial Parks" /><option value="Distribution" /><option value="Mixed-Use" /></datalist>
          <EditorField label="Defining metric" name="metric" value={project?.metric} error={errors.metric} />
          <EditorField label="Development status" name="status" value={project?.status} error={errors.status} />
          <EditorField label="Engagement model" name="engagement" value={project?.engagement} error={errors.engagement} />
        </EditorSection>

        <EditorSection id="story" number="03" title="Facility content" copy="Choose a facility brochure layout or the original completed-project case study. Photos can be added later.">
          <label className="cms-editor-field is-wide"><span>Project page format</span><select value={facility ? "facility" : "case-study"} onChange={(event) => { setFacility(event.target.value === "facility"); setDirty(true); }}><option value="facility">Facility / availability brochure</option><option value="case-study">Completed-project case study</option></select></label>
          {facility ? <><FacilityFields value={details} errors={errors} onChange={(next) => { setDetails(next); setDirty(true); }} />{PROJECT_CHAPTERS.map((chapter) => <input key={chapter} type="hidden" name={chapter} value={project?.[chapter] ?? ""} />)}</> : <div className="cms-chapter-editor is-wide">
            {chapters.map((chapter, index) => (
              <article key={chapter}>
                <header><span>{String(index + 1).padStart(2, "0")}</span><strong>{chapterLabels[chapter]}</strong><div><button type="button" onClick={() => moveChapter(index, -1)} disabled={index === 0} aria-label={`Move ${chapterLabels[chapter]} up`}>↑</button><button type="button" onClick={() => moveChapter(index, 1)} disabled={index === chapters.length - 1} aria-label={`Move ${chapterLabels[chapter]} down`}>↓</button></div></header>
                <textarea aria-label={`${chapterLabels[chapter]} content`} name={chapter} defaultValue={project?.[chapter]} rows={7} />
                {errors[chapter] && <em>{errors[chapter]}</em>}
              </article>
            ))}
          </div>}
        </EditorSection>

        <EditorSection id="media" number="04" title="Media" copy="Assign a cover image and an ordered set of gallery images. Each picker applies the selected asset to the field that opened it.">
          <label className="cms-editor-field is-wide"><span>Cover image <small>Used on portfolio cards and as the project-page hero</small></span><div className="cms-cover-editor"><div>{coverImage.startsWith("/") && <Image src={coverImage} alt="" fill sizes="180px" />}</div><span><input aria-label="Cover image path" autoComplete="off" name="coverImage" placeholder="/media/projects/cover-image.webp" spellCheck={false} value={coverImage} onChange={(event) => setCoverImage(event.target.value)} /><MediaPicker label="Choose cover image" type="image" onSelect={(asset) => { setCoverImage(asset.publicPath); setDirty(true); }} /></span></div>{errors.coverImage && <em>{errors.coverImage}</em>}</label>
          <div className="cms-gallery-editor is-wide">
            <div className="cms-media-role"><strong>Project gallery</strong><small>Shown on the project detail page in the order below. Use the arrows to reorder images.</small></div>
            <div className="cms-gallery-add"><input aria-label="Gallery image path" autoComplete="off" spellCheck={false} value={galleryDraft} onChange={(event) => setGalleryDraft(event.target.value)} placeholder="Optional: paste a public image path" /><button type="button" onClick={() => { const path = galleryDraft.trim(); if (!path) return; setGallery((items) => [...items, path]); setGalleryDraft(""); setDirty(true); }}>Add pasted path</button><MediaPicker label="Add gallery image" type="image" onSelect={(asset) => { setGallery((items) => [...items, asset.publicPath]); setDirty(true); }} /></div>
            {errors.galleryImages && <em>{errors.galleryImages}</em>}
            <div>{gallery.map((item, index) => <article key={`${item}-${index}`}><div>{item.startsWith("/") && <Image src={item} alt="" fill sizes="120px" />}</div><p><strong>Gallery {String(index + 1).padStart(2, "0")}</strong><code>{item}</code></p><span><button aria-label={`Move gallery image ${index + 1} up`} type="button" onClick={() => moveGallery(index, -1)} disabled={index === 0}>↑</button><button aria-label={`Move gallery image ${index + 1} down`} type="button" onClick={() => moveGallery(index, 1)} disabled={index === gallery.length - 1}>↓</button><button type="button" onClick={() => { setGallery((items) => items.filter((_, itemIndex) => itemIndex !== index)); setDirty(true); }}>Remove</button></span></article>)}</div>
            {!gallery.length && <p className="cms-gallery-empty">No gallery images added yet.</p>}
          </div>
        </EditorSection>

        <EditorSection id="homepage" number="05" title="Homepage feature" copy="Show this project as a full-screen scroll story in the homepage's Selected Developments section. Featured projects appear in display order.">
          <div className="cms-seo-toggles is-wide"><label><input name="homepageFeatured" type="checkbox" defaultChecked={project?.homepageFeatured ?? false} /><span>Show this project on the homepage</span></label></div>
          <label className="cms-editor-field is-wide"><span>Homepage slide image <small>One image used for the whole story: full screen behind the details, then revealed as the finished slide. Upload it as designed.</small></span><div className="cms-cover-editor"><div>{homepageImage.startsWith("/") && <Image src={homepageImage} alt="" fill sizes="180px" />}</div><span><input aria-label="Homepage slide image path" autoComplete="off" name="homepageImage" placeholder="/media/projects/homepage-slide.webp" spellCheck={false} value={homepageImage} onChange={(event) => setHomepageImage(event.target.value)} /><MediaPicker label="Choose homepage image" type="image" onSelect={(asset) => { setHomepageImage(asset.publicPath); setDirty(true); }} /></span></div>{errors.homepageImage && <em>{errors.homepageImage}</em>}</label>
          {facility ? <><p className="cms-field-note is-wide">The homepage uses the facility name, specifications, headline, summary and offering above. Changes here stay in sync automatically. Assign a homepage image when photography is ready.</p>{(["homepageHeadline", "homepageSubline", "homepageSpecs", "homepageTagline", "homepageTaglineSub", "homepageClosing", "homepageServices"] as const).map((key) => <input key={key} type="hidden" name={key} value={project?.[key] ?? ""} />)}</> : <>
          <EditorField label="Headline" name="homepageHeadline" value={project?.homepageHeadline} error={errors.homepageHeadline} />
          <EditorField label="Location line" name="homepageSubline" value={project?.homepageSubline} error={errors.homepageSubline} />
          <label className="cms-editor-field is-wide"><span>Slide 2 tagline <small>Top left of the finished slide. One line per row.</small></span><textarea name="homepageTagline" defaultValue={project?.homepageTagline ?? ""} rows={3} placeholder={"SPACES THAT KEEP\nTHE WORLD MOVING"} />{errors.homepageTagline && <em>{errors.homepageTagline}</em>}</label>
          <label className="cms-editor-field is-wide"><span>Slide 2 tagline sub-line <small>Smaller text under the tagline.</small></span><textarea name="homepageTaglineSub" defaultValue={project?.homepageTaglineSub ?? ""} rows={2} placeholder={"LOGISTICS INFRASTRUCTURE\nBUILT FOR WHAT'S NEXT"} />{errors.homepageTaglineSub && <em>{errors.homepageTaglineSub}</em>}</label>
          <label className="cms-editor-field is-wide"><span>Slide 2 closing line <small>Bottom left of the finished slide.</small></span><textarea name="homepageClosing" defaultValue={project?.homepageClosing ?? ""} rows={3} placeholder={"ENGINEERED FOR EFFICIENCY.\nBUILT FOR GROWTH."} />{errors.homepageClosing && <em>{errors.homepageClosing}</em>}</label>
          <input type="hidden" name="homepageServices" value={project?.homepageServices ?? ""} />
          <label className="cms-editor-field is-wide"><span>Project details <small>One per line as “Label: Value”, shown in this order.</small></span><textarea name="homepageSpecs" defaultValue={project?.homepageSpecs ?? ""} rows={10} placeholder={"Plot size: 12,465 sqm\nBuilt-up area: 7,963 sqm\nEaves height: 15 m"} />{errors.homepageSpecs && <em>{errors.homepageSpecs}</em>}</label>
          </>}
        </EditorSection>

        <EditorSection id="seo" number="06" title="SEO" copy="Control search visibility and preview exactly how this project appears in search and social sharing.">
          <SeoControls initial={project} fallbackTitle={name} fallbackDescription={project?.philosophy ?? ""} fallbackImage={coverImage} route={`/portfolio/${slug || "project-slug"}`} errors={errors} redirects={redirects} />
        </EditorSection>

        <EditorSection id="publishing" number="07" title="Publishing" copy="Drafts can be incomplete. Publishing requires every essential project field.">
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
