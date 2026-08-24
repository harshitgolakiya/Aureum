"use client";

import { useState } from "react";
import { MediaPicker } from "./media/media-picker";

type SeoValue = {
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  searchIndex: boolean;
  searchFollow: boolean;
  socialTitle: string;
  socialDescription: string;
  socialImage: string;
};

function Count({ value, ideal, maximum }: { value: string; ideal: number; maximum: number }) {
  const state = value.length > maximum ? "is-over" : value.length > ideal ? "is-long" : "";
  return <small className={`cms-seo-count ${state}`}>{value.length} / {ideal} recommended</small>;
}

export function SeoControls({
  initial,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  route,
  errors = {},
  redirects = [],
}: {
  initial?: Partial<SeoValue>;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage: string;
  route: string;
  errors?: Record<string, string>;
  redirects?: Array<{ oldSlug: string; createdAt: string }>;
}) {
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonicalUrl ?? "");
  const [socialTitle, setSocialTitle] = useState(initial?.socialTitle ?? "");
  const [socialDescription, setSocialDescription] = useState(initial?.socialDescription ?? "");
  const [socialImage, setSocialImage] = useState(initial?.socialImage ?? "");
  const title = seoTitle || fallbackTitle || "Untitled content";
  const description = seoDescription || fallbackDescription || "Add a concise description to preview this search result.";
  const shareTitle = socialTitle || title;
  const shareDescription = socialDescription || description;
  const shareImage = socialImage || fallbackImage;

  return <div className="cms-seo-controls is-wide">
    <div className="cms-seo-fields">
      <label><span>SEO title</span><input name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} /><Count value={seoTitle} ideal={60} maximum={70} />{errors.seoTitle && <em>{errors.seoTitle}</em>}</label>
      <label><span>SEO description</span><textarea name="seoDescription" rows={4} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} /><Count value={seoDescription} ideal={160} maximum={180} />{errors.seoDescription && <em>{errors.seoDescription}</em>}</label>
      <label><span>Canonical URL <small>Leave blank to use {route}</small></span><input name="canonicalUrl" placeholder={route} value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} />{errors.canonicalUrl && <em>{errors.canonicalUrl}</em>}</label>
      <div className="cms-seo-toggles"><label><input name="searchIndex" type="checkbox" defaultChecked={initial?.searchIndex ?? true} /><span>Allow search engines to index this page</span></label><label><input name="searchFollow" type="checkbox" defaultChecked={initial?.searchFollow ?? true} /><span>Allow search engines to follow links</span></label></div>
      <label><span>Social title</span><input name="socialTitle" value={socialTitle} onChange={(event) => setSocialTitle(event.target.value)} /><Count value={socialTitle} ideal={60} maximum={70} />{errors.socialTitle && <em>{errors.socialTitle}</em>}</label>
      <label><span>Social description</span><textarea name="socialDescription" rows={4} value={socialDescription} onChange={(event) => setSocialDescription(event.target.value)} /><Count value={socialDescription} ideal={160} maximum={200} />{errors.socialDescription && <em>{errors.socialDescription}</em>}</label>
      <label><span>Social image <small>Recommended 1200 × 630</small></span><div className="cms-seo-image-field"><input name="socialImage" value={socialImage} onChange={(event) => setSocialImage(event.target.value)} /><MediaPicker label="Choose image" type="image" onSelect={(asset) => setSocialImage(asset.publicPath)} /></div>{errors.socialImage && <em>{errors.socialImage}</em>}</label>
    </div>
    <div className="cms-seo-previews">
      <article className="cms-search-preview"><p>Search result preview</p><small>{canonicalUrl || route}</small><h3>{title}</h3><span>{description}</span></article>
      <article className="cms-social-preview"><p>Social card preview</p><div className="cms-social-preview-image" style={shareImage ? { backgroundImage: `url(${JSON.stringify(shareImage).slice(1, -1)})` } : undefined}>{!shareImage && <span>No social image selected</span>}</div><section><small>AUREUM</small><h3>{shareTitle}</h3><p>{shareDescription}</p></section></article>
      {redirects.length > 0 && <article className="cms-seo-redirects"><p>Slug redirect history</p>{redirects.map((redirect) => <div key={redirect.oldSlug}><code>{redirect.oldSlug}</code><span>Permanent redirect · {new Date(redirect.createdAt).toLocaleDateString()}</span></div>)}</article>}
    </div>
  </div>;
}
