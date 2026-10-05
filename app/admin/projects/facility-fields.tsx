"use client";

import type { ProjectDetails } from "@/data/project-details";

export function FacilityFields({ value, onChange, errors }: { value: ProjectDetails; onChange: (value: ProjectDetails) => void; errors: Record<string, string> }) {
  function field(key: keyof ProjectDetails, next: unknown) { onChange({ ...value, [key]: next }); }
  function text(label: string, key: "headline" | "offering" | "featuresTitle" | "contactName" | "contactPhone" | "brochure" | "imageCaption") {
    return <label className="cms-editor-field" key={key}><span>{label}</span><input value={value[key]} onChange={(event) => field(key, event.target.value)} />{errors[`details.${key}`] && <em>{errors[`details.${key}`]}</em>}</label>;
  }
  return <>
    <input type="hidden" name="projectDetails" value={JSON.stringify(value)} />
    {errors.details && <p className="cms-alert cms-alert-error is-wide">{errors.details}</p>}
    {text("Facility headline", "headline")}{text("Offering / commercial terms", "offering")}
    <div className="cms-chapter-editor cms-facility-editor is-wide">
      <h3>Specifications</h3><p>Keep the original units and approximation notes. Add any specification the facility needs.</p>
      {value.specifications.map((spec, index) => <article key={index}>
        <header><strong>Specification {index + 1}</strong><button type="button" onClick={() => field("specifications", value.specifications.filter((_, i) => i !== index))}>Remove</button></header>
        {(["label", "value", "note"] as const).map((key) => <label className="cms-editor-field" key={key}><span>{key === "note" ? "Note (optional)" : key}</span><input value={spec[key]} onChange={(event) => field("specifications", value.specifications.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item))} /></label>)}
        {errors[`details.specifications.${index}`] && <em>{errors[`details.specifications.${index}`]}</em>}
      </article>)}
      <button type="button" onClick={() => field("specifications", [...value.specifications, { label: "", value: "", note: "" }])}>Add specification</button>
    </div>
    {text("Features heading", "featuresTitle")}
    <label className="cms-editor-field is-wide"><span>Features / advantages <small>One per line</small></span><textarea rows={6} value={value.features.join("\n")} onChange={(event) => field("features", event.target.value.split("\n"))} /></label>
    <label className="cms-editor-field is-wide"><span>Designed for / sectors <small>One per line, optional</small></span><textarea rows={4} value={value.sectors.join("\n")} onChange={(event) => field("sectors", event.target.value.split("\n"))} /></label>
    <div className="cms-chapter-editor cms-facility-editor is-wide">
      <h3>Content sections</h3><p>Add connectivity, operational details, or other headings. Use the arrows to set their order.</p>
      {value.sections.map((section, index) => <article key={index}>
        <header><strong>Section {index + 1}</strong><div>{([-1, 1] as const).map((direction) => <button type="button" key={direction} disabled={index + direction < 0 || index + direction >= value.sections.length} aria-label={`Move section ${index + 1} ${direction === -1 ? "up" : "down"}`} onClick={() => { const next = [...value.sections]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; field("sections", next); }}>{direction === -1 ? "↑" : "↓"}</button>)}<button type="button" onClick={() => field("sections", value.sections.filter((_, i) => i !== index))}>Remove</button></div></header>
        <label className="cms-editor-field"><span>Heading</span><input value={section.title} onChange={(event) => field("sections", value.sections.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} /></label>
        <label className="cms-editor-field"><span>Body</span><textarea rows={5} value={section.body} onChange={(event) => field("sections", value.sections.map((item, i) => i === index ? { ...item, body: event.target.value } : item))} /></label>
        {errors[`details.sections.${index}`] && <em>{errors[`details.sections.${index}`]}</em>}
      </article>)}
      <button type="button" onClick={() => field("sections", [...value.sections, { title: "", body: "" }])}>Add content section</button>
    </div>
    {text("Enquiry contact", "contactName")}{text("Enquiry phone", "contactPhone")}
    {text("Brochure PDF path", "brochure")}{text("Image caption / render disclaimer", "imageCaption")}
  </>;
}
