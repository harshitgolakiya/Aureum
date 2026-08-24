"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { CmsField, CmsKey } from "@/lib/cms/schema";
import { savePageContentAction, type PageEditorState } from "./actions";

type EditorSection = {
  key: CmsKey;
  title: string;
  description: string;
  fields: readonly CmsField[];
  value: Record<string, string>;
};

const initialState: PageEditorState = { ok: false };

export function PageContentEditor({ canEdit = true, editorSlug, previewHref, sections }: { canEdit?: boolean; editorSlug: string; previewHref: string; sections: EditorSection[] }) {
  const [state, formAction, pending] = useActionState(savePageContentAction, initialState);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const canSubmit = dirty || Boolean(!state.ok && state.message);
  return <form action={formAction} className="cms-page-editor" onChange={() => setDirty(true)} onSubmit={() => setDirty(false)}>
    <input type="hidden" name="editorSlug" value={editorSlug} />
    <aside className="cms-editor-rail">
      <span>On this page</span>
      {sections.map((section, index) => <a href={`#section-${section.key}`} key={section.key}>{String(index + 1).padStart(2, "0")} {section.title}</a>)}
      <Link href={previewHref} target="_blank">Preview saved page ↗</Link>
    </aside>
    <div className="cms-page-editor-main">
      {state.message && <div className={`cms-alert ${state.ok ? "cms-alert-success" : "cms-alert-error"}`}>{state.message}</div>}
      {sections.map((section, sectionIndex) => <section className="cms-editor-section cms-page-section" id={`section-${section.key}`} key={section.key}>
        <header><span>{String(sectionIndex + 1).padStart(2, "0")}</span><div><h2>{section.title}</h2><p>{section.description}</p></div></header>
        <div className="cms-page-fields">
          {section.fields.map((field) => {
            const name = `${section.key}.${field.name}`;
            const error = state.errors?.[name];
            return <label className={`${field.kind === "textarea" ? "is-wide" : ""}${error ? " has-error" : ""}`} key={field.name}>
              <span>{field.label}{field.maxLength && <small>Maximum {field.maxLength} characters</small>}</span>
              {field.kind === "textarea" ? <textarea aria-describedby={error ? `${name}-error` : undefined} aria-invalid={Boolean(error)} defaultValue={section.value[field.name]} disabled={!canEdit} maxLength={field.maxLength} name={name} rows={field.maxLength && field.maxLength > 800 ? 6 : 4} required /> : <input aria-describedby={error ? `${name}-error` : undefined} aria-invalid={Boolean(error)} defaultValue={section.value[field.name]} disabled={!canEdit} maxLength={field.maxLength} name={name} type={field.kind ?? "text"} required />}
              {error && <small className="cms-field-error" id={`${name}-error`}>{error}</small>}
            </label>;
          })}
        </div>
      </section>)}
    </div>
    <footer className="cms-page-actionbar"><div>{!canEdit ? "Viewer access · editing disabled" : pending ? "Saving…" : dirty ? "You have unsaved changes" : !state.ok && state.message ? "Changes were not saved" : state.savedAt ? `Saved ${new Date(state.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "All content is saved"}</div><div><Link href={previewHref} target="_blank">Preview</Link>{canEdit && <button type="submit" disabled={pending || !canSubmit}>{pending ? "Saving…" : "Save changes"}</button>}</div></footer>
  </form>;
}
