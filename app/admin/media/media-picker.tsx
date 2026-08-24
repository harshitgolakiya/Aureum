"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type PickerAsset = { id: string; filename: string; publicPath: string; type: "image" | "video"; altText: string; focalX: number; focalY: number; posterPath: string };

export function MediaPicker({ type = "image", onSelect, label = "Choose from media" }: { type?: "image" | "video" | "all"; onSelect: (asset: PickerAsset) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<PickerAsset[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const visible = useMemo(() => assets.filter((asset) => (type === "all" || asset.type === type) && (!query || `${asset.filename} ${asset.altText} ${asset.publicPath}`.toLowerCase().includes(query.toLowerCase()))), [assets, query, type]);

  async function show() {
    setOpen(true); setLoading(true);
    const response = await fetch("/api/admin/media");
    const payload = await response.json();
    if (response.ok) setAssets(payload.assets);
    setLoading(false);
  }

  return <><button className="cms-media-picker-trigger" type="button" onClick={show}>{label}</button>{open && <div className="cms-media-picker-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section aria-label="Choose media asset" aria-modal="true" className="cms-media-picker" role="dialog"><header><div><p className="cms-eyebrow">Media picker</p><h2>Choose an optimized asset</h2></div><button aria-label="Close media picker" type="button" onClick={() => setOpen(false)}>×</button></header><label><span className="sr-only">Search media</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media library" /></label>{loading ? <p className="cms-media-picker-state">Loading media…</p> : <div>{visible.map((asset) => <button key={asset.id} type="button" onClick={() => { onSelect(asset); setOpen(false); }}><span>{asset.type === "image" ? <Image src={asset.publicPath} alt="" fill sizes="140px" style={{ objectPosition: `${asset.focalX}% ${asset.focalY}%` }} /> : <video muted poster={asset.posterPath || undefined} src={asset.publicPath} />}</span><strong>{asset.filename}</strong><small>{asset.publicPath}</small></button>)}</div>}{!loading && !visible.length && <p className="cms-media-picker-state">No matching assets.</p>}</section></div>}</>;
}
