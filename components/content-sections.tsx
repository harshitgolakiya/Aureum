import { ArrowLink, Eyebrow, Media } from "./ui";
export function EditorialSection({
  index,
  label,
  title,
  children,
  reverse = false,
}: {
  index: string;
  label: string;
  title: string;
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className={`editorial ${reverse ? "reverse" : ""}`}>
      <div>
        <Eyebrow>
          {index} / {label}
        </Eyebrow>
        <h2>{title}</h2>
      </div>
      <div className="editorial-body">{children}</div>
    </section>
  );
}
export function PartnerBlock({
  n,
  title,
  headline,
  overview,
  how,
  who,
  cta,
}: {
  n: string;
  title: string;
  headline: string;
  overview: string;
  how: string;
  who: string;
  cta: string;
}) {
  return (
    <section className="partner-block">
      <div className="partner-side">
        <span>{n}</span>
        <p>{title}</p>
      </div>
      <div>
        <h2>{headline}</h2>
        <p className="large-copy">{overview}</p>
        <div className="partner-detail">
          <div>
            <small>How it works</small>
            <p>{how}</p>
          </div>
          <div>
            <small>Who this is for</small>
            <p>{who}</p>
          </div>
        </div>
        <ArrowLink href="/contact" dark>
          {cta}
        </ArrowLink>
      </div>
    </section>
  );
}
export function PlaceholderPeople() {
  return (
    <div className="people-grid">
      {[1, 2, 3].map((n) => (
        <article key={n}>
          <Media label={`leadership-portrait-0${n}.webp`} />
          <h3>Leadership Profile 0{n}</h3>
          <p>Role pending approval</p>
          <small>Professional biography and expertise pending.</small>
        </article>
      ))}
    </div>
  );
}
