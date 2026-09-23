"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamMember } from "@/lib/cms/team";
import { MediaPicker } from "../media/media-picker";
import { saveTeamMemberAction, type TeamEditorState } from "./actions";

const initialState: TeamEditorState = { ok: false };

export function TeamEditor({ member }: { member?: TeamMember }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveTeamMemberAction, initialState);
  const [portrait, setPortrait] = useState(member?.portrait ?? "");
  const [profilePortrait, setProfilePortrait] = useState(member?.profilePortrait ?? "");

  useEffect(() => {
    if (!state.ok || !state.slug) return;
    router.replace(`/admin/team/${state.slug}?saved=1`);
    router.refresh();
  }, [router, state.ok, state.slug]);

  const errors = state.errors ?? {};
  return (
    <form action={action} className="cms-project-editor">
      <input type="hidden" name="originalSlug" value={member?.slug ?? ""} />
      <aside className="cms-editor-outline">
        <p>Team profile</p>
        <a href="#identity">Identity</a><a href="#media">Media</a><a href="#biography">Biography</a><a href="#publishing">Publishing</a>
        <div><span className={`cms-record-status ${member?.published ? "is-published" : "is-draft"}`}><i />{member?.published ? "Published" : "Draft"}</span></div>
      </aside>
      <div className="cms-editor-canvas">
        {state.message && <div className={`cms-alert ${state.ok ? "cms-alert-success" : "cms-alert-error"}`}>{state.message}</div>}
        <EditorSection id="identity" number="01" title="Identity" copy="Name, role, and placement on the leadership page.">
          <EditorField name="name" label="Name" value={member?.name} error={errors.name} required wide />
          <EditorField name="slug" label="Slug" value={member?.slug} error={errors.slug} placeholder="generated-from-name" />
          <EditorField name="role" label="Role" value={member?.role} error={errors.role} required />
          <EditorField name="discipline" label="Discipline" value={member?.discipline} error={errors.discipline} required />
          <EditorField name="visualLabel" label="Card label" value={member?.visualLabel} placeholder="Optional short label" />
          <label className="cms-editor-field"><span>Leadership group</span><select name="group" defaultValue={member?.group ?? "senior"}><option value="executive">Executive Leadership</option><option value="senior">Senior Management</option></select></label>
        </EditorSection>
        <EditorSection id="media" number="02" title="Media" copy="Choose the card portrait and the larger profile portrait from the media library.">
          <MediaField name="portrait" label="Card portrait" value={portrait} setValue={setPortrait} error={errors.portrait} />
          <MediaField name="profilePortrait" label="Profile portrait" value={profilePortrait} setValue={setProfilePortrait} error={errors.profilePortrait} />
        </EditorSection>
        <EditorSection id="biography" number="03" title="Biography" copy="The introduction is required; additional paragraphs are optional.">
          <EditorField name="biographyOne" label="Introduction" value={member?.biographyOne} error={errors.biographyOne} textarea required wide />
          <EditorField name="biographyTwo" label="Experience" value={member?.biographyTwo} textarea wide />
          <EditorField name="biographyThree" label="Aureum role" value={member?.biographyThree} textarea wide />
          <EditorField name="biographyFour" label="Investment philosophy" value={member?.biographyFour} textarea wide />
          <EditorField name="biographyFive" label="Platform vision" value={member?.biographyFive} textarea wide />
        </EditorSection>
        <EditorSection id="publishing" number="04" title="Publishing" copy="Control ordering and whether this profile appears on the public website.">
          <EditorField name="sortOrder" label="Display order" value={member?.sortOrder ?? 0} type="number" />
          <label className="cms-check"><input name="published" type="checkbox" defaultChecked={member?.published ?? true} /><span>Visible on the website</span></label>
        </EditorSection>
      </div>
      <footer className="cms-editor-actionbar"><div>{pending ? "Saving…" : state.message ?? "Ready"}</div><div><Link href="/admin/team">Cancel</Link><button disabled={pending} type="submit">{pending ? "Saving…" : member ? "Save member" : "Add member"}</button></div></footer>
    </form>
  );
}

function EditorSection({ id, number, title, copy, children }: { id: string; number: string; title: string; copy: string; children: React.ReactNode }) {
  return <section className="cms-editor-section" id={id}><header><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></header><div className="cms-editor-grid">{children}</div></section>;
}

function EditorField({ name, label, value = "", error, textarea = false, required = false, wide = false, type = "text", placeholder }: { name: string; label: string; value?: string | number; error?: string; textarea?: boolean; required?: boolean; wide?: boolean; type?: "text" | "number"; placeholder?: string }) {
  return <label className={`cms-editor-field ${wide ? "is-wide" : ""}`}><span>{label}{!required && <small>Optional</small>}</span>{textarea ? <textarea name={name} defaultValue={value} rows={6} required={required} /> : <input name={name} type={type} defaultValue={value} required={required} placeholder={placeholder} />}{error && <em>{error}</em>}</label>;
}

function MediaField({ name, label, value, setValue, error }: { name: string; label: string; value: string; setValue: (value: string) => void; error?: string }) {
  return <label className="cms-editor-field is-wide"><span>{label}</span><div className="cms-gallery-add"><input name={name} value={value} required onChange={(event) => setValue(event.target.value)} placeholder="/uploads/media/portrait.webp" /><MediaPicker label={`Choose ${label.toLowerCase()}`} type="image" onSelect={(asset) => setValue(asset.publicPath)} /></div>{error && <em>{error}</em>}</label>;
}
