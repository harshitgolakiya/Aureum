import Link from "next/link";
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
}: {
  label: string;
  className?: string;
}) {
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
      className={`media media-${variant} ${className}`}
      style={
        { "--media-angle": `${(seed % 12) - 6}deg` } as React.CSSProperties
      }
    >
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
      <div className="media-status">
        <span>Visual asset reserved</span>
        <small>{label}</small>
      </div>
    </div>
  );
}
export function PageHero({
  eyebrow,
  title,
  copy,
  identity = "perspective",
}: {
  eyebrow: string;
  title: string;
  copy: string;
  identity?: "perspective" | "pathways" | "portfolio" | "insights";
}) {
  return (
    <section className={`page-hero page-hero-${identity}`}>
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
