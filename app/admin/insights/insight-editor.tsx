"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CmsWorkflowStatus, InsightArticle } from "@/data/site";
import { INSIGHT_BLOCK_TYPES, parseInsightDocument, serializeInsightDocument, type InsightBlockType, type InsightContentBlock } from "@/lib/cms/insight-document";
import { slugifyInsight } from "@/lib/cms/insight-validation";
import { checkInsightSlugAction, saveInsightEditorAction, type InsightEditorResult } from "./editor-actions";
import { MediaPicker } from "../media/media-picker";
import { SeoControls } from "../seo-controls";
import { formatDubaiDateTimeLocal } from "@/lib/cms/scheduling";

const blockLabels: Record<InsightBlockType, string> = { paragraph: "Paragraph", heading: "Heading", list: "List", quote: "Quote", link: "Link", image: "Image", divider: "Divider" };
const recoveryKey = (slug: string) => `aureum:insight-recovery:${slug || "new"}`;
const newBlock = (type: InsightBlockType): InsightContentBlock => ({ id: crypto.randomUUID(), type, ...(type === "heading" ? { level: 2 as const, text: "" } : {}), ...(type === "list" ? { style: "unordered" as const, items: [""] } : {}), ...(["paragraph", "quote", "link"].includes(type) ? { text: "" } : {}) });

type RecoverySnapshot = { fields: Record<string, string>; blocks: InsightContentBlock[]; savedAt: string };

export function InsightEditor({ insight, redirects = [] }: { insight?: InsightArticle & { lockVersion?: number }; redirects?: Array<{ oldSlug: string; createdAt: string }> }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [currentSlug, setCurrentSlug] = useState(insight?.slug ?? "");
  const [title, setTitle] = useState(insight?.title ?? "");
  const [slug, setSlug] = useState(insight?.slug ?? "");
  const [slugAutomatic, setSlugAutomatic] = useState(!insight);
  const [slugStatus, setSlugStatus] = useState("");
  const [coverImage, setCoverImage] = useState(insight?.coverImage ?? "/media/heroes/insights.webp");
  const [blocks, setBlocks] = useState<InsightContentBlock[]>(() => parseInsightDocument(insight?.bodyDocument ?? "", insight?.body ?? ""));
  const [blockType, setBlockType] = useState<InsightBlockType>("paragraph");
  const [dirty, setDirty] = useState(false);
  const [published, setPublished] = useState(insight?.published ?? false);
  const [workflowStatus, setWorkflowStatus] = useState<CmsWorkflowStatus>(insight?.workflowStatus ?? "draft");
  const [result, setResult] = useState<InsightEditorResult>({ ok: true });
  const [recovery, setRecovery] = useState<RecoverySnapshot | null>(null);
  const [lockVersion, setLockVersion] = useState(insight?.lockVersion ?? 0);

  const submit = useCallback((intent: "autosave" | "draft" | "save" | "publish" | "schedule") => {
    const form = formRef.current;
    if (!form || isPending) return;
    const formData = new FormData(form);
    formData.set("intent", intent);
    formData.set("originalSlug", currentSlug);
    formData.set("lockVersion", String(lockVersion));
    formData.set("slug", slug);
    formData.set("bodyDocument", serializeInsightDocument(blocks));
    startTransition(async () => {
      const response = await saveInsightEditorAction(formData);
      setResult(response);
      if (!response.ok || !response.slug) return;
      localStorage.removeItem(recoveryKey(currentSlug));
      localStorage.removeItem(recoveryKey(""));
      const wasNew = !currentSlug;
      setCurrentSlug(response.slug);
      setSlug(response.slug);
      setPublished(Boolean(response.published));
      if (response.workflowStatus) setWorkflowStatus(response.workflowStatus);
      if (response.lockVersion !== undefined) setLockVersion(response.lockVersion);
      setDirty(false);
      setRecovery(null);
      if (wasNew || response.slug !== currentSlug) router.replace(`/admin/insights/${response.slug}`);
      else if (intent !== "autosave") router.refresh();
    });
  }, [blocks, currentSlug, isPending, lockVersion, router, slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(recoveryKey(insight?.slug ?? ""));
        if (saved) setRecovery(JSON.parse(saved) as RecoverySnapshot);
      } catch {
        localStorage.removeItem(recoveryKey(insight?.slug ?? ""));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [insight?.slug]);

  useEffect(() => {
    if (!dirty || !formRef.current) return;
    const timer = window.setTimeout(() => {
      const fields: Record<string, string> = {};
      new FormData(formRef.current ?? undefined).forEach((value, key) => { if (typeof value === "string") fields[key] = value; });
      localStorage.setItem(recoveryKey(currentSlug), JSON.stringify({ fields, blocks, savedAt: new Date().toISOString() } satisfies RecoverySnapshot));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [blocks, currentSlug, dirty, title, slug, coverImage]);

  useEffect(() => {
    if (!dirty || published || isPending || (!title.trim() && !slug.trim())) return;
    const timer = window.setTimeout(() => submit("autosave"), 15000);
    return () => window.clearTimeout(timer);
  }, [dirty, isPending, published, slug, submit, title]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function updateBlock(index: number, patch: Partial<InsightContentBlock>) {
    setBlocks((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    setDirty(true);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((items) => { const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next; });
    setDirty(true);
  }

  function restoreRecovery() {
    if (!recovery || !formRef.current) return;
    Object.entries(recovery.fields).forEach(([name, value]) => {
      const control = formRef.current?.elements.namedItem(name);
      if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) control.value = value;
    });
    setTitle(recovery.fields.title ?? title);
    setSlug(recovery.fields.slug ?? slug);
    setCoverImage(recovery.fields.coverImage ?? coverImage);
    setBlocks(recovery.blocks);
    setRecovery(null);
    setDirty(true);
  }

  async function checkSlug() {
    const response = await checkInsightSlugAction(slug, currentSlug);
    if (response.slug !== slug) setSlug(response.slug);
    setSlugStatus(response.message);
  }

  const errors = result.errors ?? {};
  const saveIntent = workflowStatus === "published" || workflowStatus === "scheduled" || workflowStatus === "unpublished" ? "save" : "draft";
  const statusLabel = workflowStatus[0].toUpperCase() + workflowStatus.slice(1);
  return (
    <form className="cms-project-editor" ref={formRef} onChange={() => setDirty(true)} onSubmit={(event) => { event.preventDefault(); submit(saveIntent); }}>
      <input type="hidden" name="originalSlug" value={currentSlug} /><input type="hidden" name="lockVersion" value={lockVersion} /><input type="hidden" name="bodyDocument" value={serializeInsightDocument(blocks)} />
      <aside className="cms-editor-outline">
        <p>Insight content</p>
        <a href="#overview">Overview</a><a href="#author">Author</a><a href="#article">Article</a><a href="#media">Media</a><a href="#seo">SEO</a><a href="#publishing">Publishing</a>
        <div><span className={`cms-record-status is-${workflowStatus}`}><i />{statusLabel}</span><small>{dirty ? "Unsaved changes" : result.savedAt ? `Saved ${new Date(result.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "All changes saved"}</small></div>
      </aside>

      <div className="cms-editor-canvas">
        {recovery && <div className="cms-recovery-alert"><div><strong>Unsaved work found</strong><small>Local recovery from {new Date(recovery.savedAt).toLocaleString()}</small></div><span><button type="button" onClick={restoreRecovery}>Restore</button><button type="button" onClick={() => { localStorage.removeItem(recoveryKey(currentSlug)); setRecovery(null); }}>Discard</button></span></div>}
        {result.message && <div className={`cms-alert ${result.ok ? "cms-alert-success" : "cms-alert-error"}`}>{result.message}</div>}

        <EditorSection id="overview" number="01" title="Overview" copy="The article identity used across listings, search, and its public URL.">
          <EditorField label="Article title" name="title" value={title} error={errors.title} wide onChange={(value) => { setTitle(value); if (slugAutomatic) setSlug(slugifyInsight(value)); }} />
          <label className="cms-editor-field is-wide"><span>Slug <small>Lowercase URL identifier</small></span><div className="cms-slug-control"><span>/insights/</span><input name="slug" value={slug} onChange={(event) => { setSlug(event.target.value); setSlugAutomatic(false); setSlugStatus(""); }} onBlur={checkSlug} /></div>{errors.slug && <em>{errors.slug}</em>}{!errors.slug && slugStatus && <small className="cms-field-note">{slugStatus}</small>}</label>
          <EditorField label="Editorial summary" name="excerpt" value={insight?.excerpt} error={errors.excerpt} textarea wide />
          <EditorField label="Category" name="category" value={insight?.category} error={errors.category} list="insight-categories" />
          <datalist id="insight-categories"><option value="Market Intelligence" /><option value="Industry Perspective" /><option value="Thought Leadership" /></datalist>
          <EditorField label="Publication date" name="date" value={insight?.date} error={errors.date} />
          <EditorField label="Read time" name="readTime" value={insight?.readTime} error={errors.readTime} placeholder="6 min read" />
        </EditorSection>

        <EditorSection id="author" number="02" title="Author" copy="Contributor details displayed beside the article.">
          <EditorField label="Author name" name="author" value={insight?.author} error={errors.author} />
          <EditorField label="Author title" name="authorTitle" value={insight?.authorTitle} error={errors.authorTitle} />
        </EditorSection>

        <EditorSection id="article" number="03" title="Article body" copy="Build safe, structured long-form content without writing HTML.">
          <div className="cms-block-editor is-wide">
            <div className="cms-block-add"><select aria-label="Content block type" value={blockType} onChange={(event) => setBlockType(event.target.value as InsightBlockType)}>{INSIGHT_BLOCK_TYPES.map((type) => <option value={type} key={type}>{blockLabels[type]}</option>)}</select><button type="button" onClick={() => { setBlocks((items) => [...items, newBlock(blockType)]); setDirty(true); }}>Add block</button></div>
            {blocks.map((block, index) => <article key={block.id}>
              <header><span>{String(index + 1).padStart(2, "0")}</span><strong>{blockLabels[block.type]}</strong><div><button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>↓</button><button className="is-danger" type="button" onClick={() => { setBlocks((items) => items.filter((_, itemIndex) => itemIndex !== index)); setDirty(true); }}>Remove</button></div></header>
              <BlockFields block={block} onChange={(patch) => updateBlock(index, patch)} />
            </article>)}
            {!blocks.length && <p className="cms-gallery-empty">No article blocks yet. Add a paragraph or heading to begin.</p>}
            {errors.bodyDocument && <em>{errors.bodyDocument}</em>}
          </div>
          <EditorField label="Closing pull quote" name="pullQuote" value={insight?.pullQuote} textarea wide />
        </EditorSection>

        <EditorSection id="media" number="04" title="Cover media" copy="Choose an optimized image from the media library or enter an existing public asset path.">
          <label className="cms-editor-field is-wide"><span>Cover image</span><div className="cms-cover-editor"><div>{coverImage.startsWith("/") && <Image src={coverImage} alt="" fill sizes="180px" />}</div><span><input name="coverImage" value={coverImage} onChange={(event) => setCoverImage(event.target.value)} /><MediaPicker onSelect={(asset) => { setCoverImage(asset.publicPath); setDirty(true); }} /></span></div>{errors.coverImage && <em>{errors.coverImage}</em>}</label>
        </EditorSection>

        <EditorSection id="seo" number="05" title="SEO" copy="Control search visibility and preview exactly how this insight appears in search and social sharing.">
          <SeoControls initial={insight} fallbackTitle={title} fallbackDescription={insight?.excerpt ?? ""} fallbackImage={coverImage} route={`/insights/${slug || "article-slug"}`} errors={errors} redirects={redirects} />
        </EditorSection>

        <EditorSection id="publishing" number="06" title="Publishing" copy="Drafts may be incomplete. Publishing requires the editorial essentials and valid content blocks.">
          <EditorField label="Display order" name="sortOrder" value={insight?.sortOrder ?? 0} type="number" />
          <EditorField label="Schedule publication — Dubai time (GST)" name="scheduledAt" value={formatDubaiDateTimeLocal(insight?.scheduledAt)} error={errors.scheduledAt} type="datetime-local" />
          <div className="cms-publish-summary is-wide"><span className={`cms-record-status is-${workflowStatus}`}><i />{statusLabel}</span><p>{published ? "Saving changes updates the public article immediately." : workflowStatus === "scheduled" ? "This insight will publish automatically at the scheduled time." : "Drafts autosave after 15 seconds. Local recovery protects unsaved work between visits."}</p></div>
        </EditorSection>
      </div>

      <footer className="cms-editor-actionbar"><div>{isPending ? "Saving…" : dirty ? "You have unsaved changes" : result.message ?? "Ready"}</div><div>
        <Link href="/admin/insights">Cancel</Link>
        {currentSlug && <><Link href={`/admin/insights/${currentSlug}/preview`} target="_blank">Desktop preview</Link><Link href={`/admin/insights/${currentSlug}/preview?view=mobile`} target="_blank">Mobile preview</Link></>}
        {currentSlug && <Link href={`/admin/insights/${currentSlug}/revisions`}>Revisions</Link>}
        <button className="is-secondary" type="button" disabled={isPending} onClick={() => submit(saveIntent)}>{published ? "Save changes" : "Save draft"}</button>
        <button className="is-secondary" type="button" disabled={isPending} onClick={() => submit("schedule")}>Schedule</button>
        <button type="button" disabled={isPending} onClick={() => submit("publish")}>{published ? "Update publication" : "Publish insight"}</button>
      </div></footer>
    </form>
  );
}

function BlockFields({ block, onChange }: { block: InsightContentBlock; onChange: (patch: Partial<InsightContentBlock>) => void }) {
  if (block.type === "divider") return <div className="cms-block-divider"><span /></div>;
  if (block.type === "list") return <div className="cms-block-fields"><label><span>List style</span><select value={block.style} onChange={(event) => onChange({ style: event.target.value as "ordered" | "unordered" })}><option value="unordered">Bulleted</option><option value="ordered">Numbered</option></select></label><label className="is-wide"><span>Items <small>One per line</small></span><textarea rows={6} value={(block.items ?? []).join("\n")} onChange={(event) => onChange({ items: event.target.value.split("\n") })} /></label></div>;
  if (block.type === "image") return <div className="cms-block-fields"><label className="is-wide"><span>Image path</span><input value={block.src ?? ""} onChange={(event) => onChange({ src: event.target.value })} /></label><div className="is-wide"><MediaPicker onSelect={(asset) => onChange({ src: asset.publicPath, alt: block.alt || asset.altText })} /></div><label><span>Alt text</span><input value={block.alt ?? ""} onChange={(event) => onChange({ alt: event.target.value })} /></label><label><span>Caption</span><input value={block.caption ?? ""} onChange={(event) => onChange({ caption: event.target.value })} /></label></div>;
  if (block.type === "link") return <div className="cms-block-fields"><label><span>Link text</span><input value={block.text ?? ""} onChange={(event) => onChange({ text: event.target.value })} /></label><label><span>URL</span><input value={block.href ?? ""} placeholder="https:// or /internal-path" onChange={(event) => onChange({ href: event.target.value })} /></label></div>;
  return <div className="cms-block-fields">{block.type === "heading" && <label><span>Heading level</span><select value={block.level} onChange={(event) => onChange({ level: Number(event.target.value) as 2 | 3 })}><option value="2">Heading 2</option><option value="3">Heading 3</option></select></label>}<label className="is-wide"><span>{blockLabels[block.type]} text</span><textarea rows={block.type === "paragraph" ? 7 : 4} value={block.text ?? ""} onChange={(event) => onChange({ text: event.target.value })} /></label></div>;
}

function EditorSection({ id, number, title, copy, children }: { id: string; number: string; title: string; copy: string; children: React.ReactNode }) {
  return <section className="cms-editor-section" id={id}><header><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></header><div className="cms-editor-grid">{children}</div></section>;
}

function EditorField({ label, name, value = "", error, textarea = false, wide = false, type = "text", list, placeholder, onChange }: { label: string; name: string; value?: string | number; error?: string; textarea?: boolean; wide?: boolean; type?: "text" | "number" | "datetime-local"; list?: string; placeholder?: string; onChange?: (value: string) => void }) {
  return <label className={`cms-editor-field ${wide ? "is-wide" : ""}`}><span>{label}</span>{textarea ? <textarea name={name} defaultValue={value} rows={5} placeholder={placeholder} /> : onChange ? <input name={name} type={type} value={value} list={list} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /> : <input name={name} type={type} defaultValue={value} list={list} placeholder={placeholder} />}{error && <em>{error}</em>}</label>;
}
