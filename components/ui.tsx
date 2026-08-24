import Link from "next/link";
import Image from "next/image";
import { approvedMedia } from "@/data/media";
export function ArrowLink({
  href,
  children,
  dark = false,
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <Link className={`button ${dark ? "dark" : ""}`} href={href}>
      {children}
      <span>↗</span>
    </Link>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span /> {children}
    </p>
  );
}
export function Media({
  label,
  className = "",
  src,
  alt,
}: {
  label: string;
  className?: string;
  src?: string;
  alt?: string;
}) {
  const approved = src ? { src, alt: alt || "", focalPoint: "50% 50%" } : approvedMedia[label];
  const variant = label.includes("portrait")
    ? "portrait"
    : label.includes("insight") || label.includes("article")
      ? "editorial"
      : label.includes("gallery")
        ? "detail"
        : "development";
  const seed = [...label].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return (
    <div
      className={`media media-${variant} ${approved ? "media-approved" : ""} ${className}`}
      style={
        { "--media-angle": `${(seed % 12) - 6}deg` } as React.CSSProperties
      }
    >
      {approved && (
        <Image
          src={approved.src}
          alt={approved.alt}
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          style={{ objectPosition: approved.focalPoint || "50% 50%" }}
        />
      )}
      <div className="media-lines" />
      <div className="media-composition" aria-hidden="true">
        <div className="media-horizon" />
        <div className="media-massing mass-a" />
        <div className="media-massing mass-b" />
        <div className="media-massing mass-c" />
        <div className="media-coordinate">
          A/{String((seed % 89) + 10).padStart(2, "0")}
        </div>
        <div className="media-subject" />
      </div>
      {!approved && (
        <div className="media-status">
          <span>Visual asset reserved</span>
          <small>{label}</small>
        </div>
      )}
    </div>
  );
}
export function PageHero({
  eyebrow,
  title,
  copy,
  identity = "perspective",
  image,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  identity?: "perspective" | "pathways" | "portfolio" | "insights";
  image?: string;
}) {
  const heroImages = {
    perspective: "/media/heroes/who-we-are.webp",
    pathways: "/media/heroes/how-we-partner.webp",
    portfolio: "/media/heroes/portfolio.webp",
    insights: "/media/heroes/insights.webp",
  };
  return (
    <section className={`page-hero page-hero-${identity}`}>
      <div className="page-hero-photo" aria-hidden="true">
        <Image
          src={image || heroImages[identity]}
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="hero-identity" aria-hidden="true">
        <div className="identity-orbit" />
        <div className="identity-axis axis-a" />
        <div className="identity-axis axis-b" />
        <div className="identity-axis axis-c" />
        <div className="identity-node node-a" />
        <div className="identity-node node-b" />
        <div className="identity-node node-c" />
        <div className="identity-frame" />
      </div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{title}</h1>
      <p>{copy}</p>
      <span className="page-no">AUREUM / 360°</span>
    </section>
  );
}
export function Connect({
  title = "The right development starts with the right conversation.",
  copy = "Whether you're exploring an opportunity, planning a development or considering what's next, Aureum brings the intelligence, perspective and development expertise to help shape the right path forward.",
}: {
  title?: string;
  copy?: string;
}) {
  return (
    <section className="connect">
      <Eyebrow>Begin a conversation</Eyebrow>
      <h2>{title}</h2>
      <div>
        <p>{copy}</p>
        <ArrowLink href="/contact">Connect with us</ArrowLink>
      </div>
    </section>
  );
}
