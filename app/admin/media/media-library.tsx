"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { MediaAsset } from "@/lib/cms/media";

function bytes(value: number) { if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }

export function MediaLibrary({ initialAssets, canEdit }: { initialAssets: MediaAsset[]; canEdit: boolean }) {
  const uploadRef = useRef<HTMLFormElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const selected = assets.find((asset) => asset.id === selectedId) ?? null;
  const visible = useMemo(() => assets.filter((asset) => (type === "all" || asset.type === type) && (!query.trim() || [asset.filename, asset.originalName, asset.altText, asset.caption, asset.publicPath].some((value) => value.toLowerCase().includes(query.toLowerCase())))), [assets, query, type]);

  async function refreshAssets() {
    const response = await fetch("/api/admin/media");
    const payload = await response.json();
    if (response.ok) setAssets(payload.assets);
  }

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice(null);
    const response = await fetch("/api/admin/media", { method: "POST", body: new FormData(event.currentTarget) });
    const payload = await response.json();
    setBusy(false); setNotice({ ok: response.ok, message: payload.message });
    if (response.ok) { uploadRef.current?.reset(); await refreshAssets(); setSelectedId(payload.asset.id); }
  }

  async function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setNotice(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, filename: form.get("filename"), altText: form.get("altText"), caption: form.get("caption"), focalX: form.get("focalX"), focalY: form.get("focalY"), posterPath: form.get("posterPath") }) });
    const payload = await response.json(); setBusy(false); setNotice({ ok: response.ok, message: payload.message });
    if (response.ok) await refreshAssets();
  }

  async function replace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = new FormData(event.currentTarget); form.set("replaceId", selected.id); form.set("filename", selected.filename); form.set("altText", selected.altText); form.set("caption", selected.caption); form.set("focalX", String(selected.focalX)); form.set("focalY", String(selected.focalY)); form.set("posterPath", selected.posterPath);
    setBusy(true); setNotice(null);
    const response = await fetch("/api/admin/media", { method: "POST", body: form });
    const payload = await response.json(); setBusy(false); setNotice({ ok: response.ok, message: payload.message });
    if (response.ok) { (event.currentTarget as HTMLFormElement).reset(); await refreshAssets(); }
  }

  async function remove() {
    if (!selected || !window.confirm(`Delete “${selected.filename}”? This cannot be undone.`)) return;
    setBusy(true); setNotice(null);
    const response = await fetch(`/api/admin/media?id=${encodeURIComponent(selected.id)}`, { method: "DELETE" });
    const payload = await response.json(); setBusy(false); setNotice({ ok: response.ok, message: payload.usage?.length ? `${payload.message} ${payload.usage.join(", ")}` : payload.message });
    if (response.ok) { setSelectedId(null); await refreshAssets(); }
  }

  return <div className="cms-media-library">
    {notice && <div className={`cms-alert ${notice.ok ? "cms-alert-success" : "cms-alert-error"}`}>{notice.message}</div>}
    {!canEdit && <div className="cms-alert">Viewer access is read-only. Asset upload and metadata controls are disabled.</div>}
    <section className="cms-library-summary"><div><p className="cms-eyebrow">Media library</p><h2>Optimized assets, ready to publish.</h2></div><div className="cms-library-counts"><span><strong>{assets.filter((item) => item.type === "image").length}</strong>Images</span><span><strong>{assets.filter((item) => item.type === "video").length}</strong>Videos</span><span><strong>{assets.filter((item) => item.usage.length).length}</strong>In use</span></div></section>

    {canEdit && <form className="cms-media-upload" ref={uploadRef} onSubmit={upload}>
      <div><p className="cms-eyebrow">Upload asset</p><h2>Drop in high-quality source media.</h2><small>Images become WebP with responsive variants. JPEG, PNG, WebP or AVIF up to 20 MB. MP4 or WebM up to 50 MB.</small></div>
      <label className="cms-upload-drop"><input accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" name="file" required type="file" /><span>Choose image or video</span></label>
      <label><span>Display filename</span><input name="filename" placeholder="Optional friendly name" /></label>
      <label><span>Alt text <small>Required for images</small></span><input name="altText" placeholder="Describe the image’s purpose" /></label>
      <label className="is-wide"><span>Caption</span><input name="caption" placeholder="Optional editorial caption" /></label>
      <label><span>Video poster path</span><input name="posterPath" placeholder="/uploads/media/poster.webp" /></label>
      <input name="focalX" type="hidden" value="50" /><input name="focalY" type="hidden" value="50" />
      <button disabled={busy} type="submit">{busy ? "Processing…" : "Upload and optimize"}</button>
    </form>}

    <div className="cms-media-tools"><label><span className="sr-only">Search media</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search filename, alt text, caption, or URL" /></label><div>{["all", "image", "video"].map((item) => <button className={type === item ? "is-active" : ""} key={item} onClick={() => setType(item)} type="button">{item === "all" ? "All assets" : `${item}s`}</button>)}</div><small>{visible.length} of {assets.length} assets</small></div>

    <div className="cms-media-workspace">
      <div className="cms-media-grid">{visible.map((asset) => <button className={selectedId === asset.id ? "is-selected" : ""} key={asset.id} onClick={() => setSelectedId(asset.id)} type="button"><div>{asset.type === "image" ? <Image src={asset.publicPath} alt="" fill sizes="(max-width: 700px) 50vw, 220px" style={{ objectPosition: `${asset.focalX}% ${asset.focalY}%` }} /> : <video muted poster={asset.posterPath || undefined} preload="metadata" src={asset.publicPath} />}</div><span><strong>{asset.filename}</strong><small>{asset.type} · {asset.width ? `${asset.width}×${asset.height} · ` : ""}{bytes(asset.sizeBytes)}</small><em>{asset.usage.length ? `${asset.usage.length} use${asset.usage.length === 1 ? "" : "s"}` : "Unused"}</em></span></button>)}</div>
      {selected ? <aside className="cms-media-inspector" key={selected.id}>
        <header><div><p className="cms-eyebrow">Asset details</p><h2>{selected.filename}</h2></div><button aria-label="Close asset details" onClick={() => setSelectedId(null)} type="button">×</button></header>
        <div className="cms-media-inspector-preview">{selected.type === "image" ? <Image src={selected.publicPath} alt={selected.altText} fill sizes="360px" style={{ objectPosition: `${selected.focalX}% ${selected.focalY}%` }} /> : <video controls poster={selected.posterPath || undefined} src={selected.publicPath} />}</div>
        <div className="cms-media-path"><code>{selected.publicPath}</code><button type="button" onClick={async () => { await navigator.clipboard.writeText(selected.publicPath); setNotice({ ok: true, message: "Media URL copied." }); }}>Copy URL</button></div>
        <form className="cms-media-details" onSubmit={saveDetails}><fieldset disabled={!canEdit}><label><span>Filename</span><input name="filename" defaultValue={selected.filename} required /></label><label><span>Alt text {selected.type === "image" && <small>Required</small>}</span><textarea name="altText" defaultValue={selected.altText} rows={3} /></label><label><span>Caption</span><textarea name="caption" defaultValue={selected.caption} rows={3} /></label><div><label><span>Focal X</span><input max="100" min="0" name="focalX" defaultValue={selected.focalX} type="number" /></label><label><span>Focal Y</span><input max="100" min="0" name="focalY" defaultValue={selected.focalY} type="number" /></label></div>{selected.type === "video" && <label><span>Poster path</span><input name="posterPath" defaultValue={selected.posterPath} /></label>}{canEdit && <button disabled={busy} type="submit">Save details</button>}</fieldset></form>
        <section className="cms-media-meta"><span><strong>{selected.originalName}</strong>Original filename</span><span><strong>{selected.mimeType}</strong>Format</span><span><strong>{selected.width ? `${selected.width} × ${selected.height}` : "Video"}</strong>Dimensions</span><span><strong>{selected.variants.length}</strong>Responsive variants</span></section>
        <section className="cms-media-usage"><p className="cms-eyebrow">Usage</p>{selected.usage.length ? <ul>{selected.usage.map((item) => <li key={item}>{item}</li>)}</ul> : <p>This asset is not currently used by CMS content.</p>}</section>
        {canEdit && selected.publicPath.startsWith("/uploads/media/") && <><form className="cms-media-replace" onSubmit={replace}><label><span>Replace source file</span><input accept={selected.type === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "video/mp4,video/webm"} name="file" required type="file" /></label><button disabled={busy} type="submit">Replace and reprocess</button></form><button className="cms-media-delete" disabled={busy || Boolean(selected.usage.length)} onClick={remove} type="button">{selected.usage.length ? "Cannot delete while in use" : "Delete asset"}</button></>}
      </aside> : <aside className="cms-media-inspector is-empty"><p>Select an asset to inspect metadata, usage, responsive variants, and editing controls.</p></aside>}
    </div>
  </div>;
}
