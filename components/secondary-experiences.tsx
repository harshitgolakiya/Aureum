"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLink, Eyebrow, Media } from "./ui";
import { PartnerSystemGraphic } from "./partner-system-graphic";
import type { LeaderContent } from "@/lib/cms/schema";

gsap.registerPlugin(ScrollTrigger);

export function WhoNarrative({
  executiveLeaders,
  seniorManagement,
}: {
  executiveLeaders: readonly LeaderContent[];
  seniorManagement: readonly LeaderContent[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const [person, setPerson] = useState<LeaderContent | null>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-who-reveal]").forEach((element) =>
        gsap.from(element, {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 82%" },
        }),
      );
      gsap.to(".who-marker", {
        scaleY: 1,
        transformOrigin: "top",
        ease: "none",
        scrollTrigger: {
          trigger: ".who-shift",
          start: "top 55%",
          end: "bottom 55%",
          scrub: true,
        },
      });
      gsap.from(".collective-statement span", {
        yPercent: 110,
        stagger: 0.1,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: ".collective-feature", start: "top 65%" },
      });
    }, root);
    return () => context.revert();
  }, []);
  useEffect(() => {
    if (person === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPerson(null);
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(".bio-overlay");
        const focusable = dialog?.querySelectorAll<HTMLElement>(
          'button,[href],[tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [person]);
  const selectedBiography =
    person === null
      ? []
      : [
          person.biographyOne,
          person.biographyTwo,
          person.biographyThree,
          person.biographyFour,
          person.biographyFive,
        ].filter(Boolean);
  return (
    <div ref={root}>
      <section className="who-shift" id="philosophy">
        <div className="who-shift-rail">
          <span>Context</span>
          <i className="who-marker" />
          <span>Philosophy</span>
        </div>
        <div data-who-reveal>
          <Eyebrow>Our Philosophy</Eyebrow>
          <h2>A different view demands a different way of thinking.</h2>
        </div>
        <div className="who-shift-copy" data-who-reveal>
          <p>
            The Aureum System brings consistency to how we assess industrial
            development opportunities, shape them and create long-term value.
          </p>
          <ArrowLink href="/how-we-partner" dark>
            Explore What We Do
          </ArrowLink>
        </div>
      </section>
      <section className="collective-feature">
        <div className="collective-portrait">
          <Media label="leadership-group-portrait.webp" />
          <span>Aureum leadership team</span>
        </div>
        <div>
          <Eyebrow>Leadership Perspective</Eyebrow>
          <h2 className="collective-statement">
            <span>Three perspectives.</span>
            <span>One standard for</span>
            <span>development.</span>
          </h2>
          <div className="collective-copy" data-who-reveal>
            <p>
              Industrial development demands more than one discipline.
            </p>
            <p>
              We bring investment and capital strategy, development management and real
              estate expertise together through a shared approach.
            </p>
            <p>
              Our collective perspective connects commercial ambition with development
              realities, aligning the capital and decisions that carry an opportunity
              from its earliest stages through to long-term performance.
            </p>
            <p>
              Together, we shape Aureum’s vision and guide how every development is
              evaluated, structured and delivered.
            </p>
          </div>
        </div>
      </section>
      <section className="leadership">
        <div className="leadership-heading" data-who-reveal>
          <Eyebrow>Executive Leadership</Eyebrow>
          <h2>Different perspectives, shared conviction.</h2>
        </div>
        <div className="leadership-list" data-who-reveal>
          {executiveLeaders.map((leader) => (
            <button
              className="leadership-card"
              type="button"
              key={leader.name}
              onClick={() => setPerson(leader)}
              aria-label={`View ${leader.name}'s profile`}
            >
              <div className="leadership-card-visual">
                <Media label={leader.portrait || "leadership-portrait-placeholder.webp"} src={leader.portrait.startsWith("/") ? leader.portrait : undefined} alt={`Portrait of ${leader.name}`} objectPosition="50% 50%" />
              </div>
              <div className="leadership-card-body">
                <strong>{leader.name}</strong>
                <span>{leader.role}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="leadership leadership-secondary">
        <div className="leadership-heading" data-who-reveal>
          <Eyebrow>Senior Management</Eyebrow>
          <h2>Experience that strengthens every development.</h2>
        </div>
        <div
          className="leadership-list leadership-list-compact"
          data-who-reveal
        >
          {seniorManagement.map((leader) => (
            <button
              className="leadership-card"
              type="button"
              key={leader.name}
              onClick={() => setPerson(leader)}
              aria-label={`View ${leader.name}'s profile`}
            >
              <div className="leadership-card-visual">
                <Media label={leader.portrait || "leadership-portrait-placeholder.webp"} src={leader.portrait.startsWith("/") ? leader.portrait : undefined} alt={`Portrait of ${leader.name}`} objectPosition="50% 50%" />
              </div>
              <div className="leadership-card-body">
                <strong>{leader.name}</strong>
                <span>{leader.role}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
      {person !== null && (
        <div
          className="bio-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bio-title"
        >
          <button
            className="bio-close"
            onClick={() => setPerson(null)}
            autoFocus
          >
            Close ×
          </button>
          <div className="bio-visual">
            <Media label={person.profilePortrait || "leadership-profile-portrait-placeholder.webp"} src={person.profilePortrait.startsWith("/") ? person.profilePortrait : undefined} alt={`Portrait of ${person.name}`} />
          </div>
          <div className="bio-copy">
            <small>Leadership profile</small>
            <h2 id="bio-title">{person.name}</h2>
            <h3>{person.role}</h3>
            <p className="pending-profile-line">
              {person.discipline}
            </p>
            {selectedBiography.length ? (
              selectedBiography.map((paragraph, index) => (
                <p key={paragraph}>
                  {index === 0 && person.name === "Sivaprasath Balakrishnan" ? (
                    <strong>{paragraph}</strong>
                  ) : (
                    paragraph
                  )}
                </p>
              ))
            ) : (
              <p>
                Approved professional biography pending. This panel is ready
                for supplied leadership content and will not invent
                professional history.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type PathwayIconName =
  | "chart"
  | "pin"
  | "industry"
  | "coins"
  | "person"
  | "building"
  | "people"
  | "document"
  | "gear"
  | "helmet"
  | "handshake"
  | "layers";

const pathwayIconPaths: Record<PathwayIconName, React.ReactNode> = {
  chart: (
    <>
      <path d="M5 19V11" />
      <path d="M10 19V6" />
      <path d="M15 19v-5" />
      <path d="M20 19V9" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6-5.4 6-10.5A6 6 0 0 0 6 10.5C6 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  industry: (
    <>
      <path d="M3 20V9l6 4V9l6 4V5h6v15Z" />
      <path d="M8 20v-4h3v4" />
      <path d="M14 20v-4h3v4" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.5" />
      <path d="M5 6.5v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5" />
      <path d="M5 11.5v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  building: (
    <>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M2 20h20" />
      <path d="M9 20v-5h6v5" />
      <path d="M9 11h2M13 11h2" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <circle cx="16.5" cy="10" r="2.3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M14.5 20a4.5 4.5 0 0 1 6.5-4" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v4h4" />
      <path d="M10 12h5M10 15.5h5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </>
  ),
  helmet: (
    <>
      <path d="M4 16a8 8 0 0 1 16 0" />
      <path d="M3 16h18" />
      <path d="M12 8v8" />
      <path d="M9 8.5V12M15 8.5V12" />
    </>
  ),
  handshake: (
    <>
      <path d="M3 10l4-4 5 2 5-2 4 4" />
      <path d="M7 6v8l5 5 5-5V6" />
      <path d="M12 8l-3 3 2 2 3-3" />
    </>
  ),
  layers: (
    <>
      <path d="M12 4l8 4.5-8 4.5-8-4.5Z" />
      <path d="M4 12.5 12 17l8-4.5" />
      <path d="M4 16.5 12 21l8-4.5" />
    </>
  ),
};

function PathwayIcon({ name }: { name: PathwayIconName }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {pathwayIconPaths[name]}
    </svg>
  );
}

type PathwayPoint = { icon: PathwayIconName; label: string; text: string };

type Pathway = {
  n: string;
  id: string;
  title: string;
  headline: string;
  how: string;
  howPoints: PathwayPoint[];
  whoPoints: PathwayPoint[];
  cta: string;
  image: string;
  visualCue: string;
  caption: string;
};

const partnerships: Pathway[] = [
  {
    n: "01",
    id: "predictive-development",
    title: "Predictive Development",
    headline: "Opportunity is where development begins.",
    how: "We bring the insights that determine development potential and shape what the UAE’s growing industries need next.",
    howPoints: [
      { icon: "chart", label: "Market", text: "Analyse market signals and emerging demand." },
      { icon: "pin", label: "Land", text: "Assess land potential and constraints." },
      { icon: "industry", label: "Industry", text: "Understand occupier needs and future requirements." },
      { icon: "coins", label: "Commercial", text: "Evaluate viability and optimal use." },
    ],
    whoPoints: [
      { icon: "person", label: "Landowners", text: "Unlock the potential of their land with us." },
      { icon: "coins", label: "Investors", text: "Access institutional-grade development opportunities with us." },
      { icon: "building", label: "Occupiers", text: "Secure future-ready facilities tailored to their needs with us." },
      { icon: "people", label: "Strategic Partners", text: "Create greater value through collaboration with us." },
    ],
    cta: "Explore Opportunities",
    image: "/how-we-1.webp",
    visualCue: "Opportunity identified",
    caption: "Identify and shape opportunity",
  },
  {
    n: "02",
    id: "purpose-built-development",
    title: "Purpose-Built Development",
    headline: "Developed around your requirements.",
    how: "We bring together asset context, commercial, design, engineering and delivery decisions around the requirements that shape the development.",
    howPoints: [
      { icon: "pin", label: "Asset Context", text: "Evaluate location dynamics and site viability." },
      { icon: "document", label: "Commercial", text: "Structure viable and efficient development solutions." },
      { icon: "gear", label: "Design & Engineering", text: "Develop facilities tailored to operational needs." },
      { icon: "helmet", label: "Delivery", text: "Execute with precision, quality and sustainability." },
    ],
    whoPoints: [
      { icon: "person", label: "Occupiers", text: "Secure future-ready facilities tailored to their needs." },
      { icon: "coins", label: "Investors", text: "Access institutional-grade development opportunities with us." },
      { icon: "building", label: "Businesses", text: "Support operational growth and long-term expansion." },
      { icon: "people", label: "Strategic Partners", text: "Create greater value through collaboration with us." },
    ],
    cta: "Explore Opportunities",
    image: "/how-we-2.webp",
    visualCue: "Requirements coordinated",
    caption: "Develop with purpose",
  },
  {
    n: "03",
    id: "strategic-development-partnerships",
    title: "Strategic Development Partnerships",
    headline: "The right partners shape the right opportunity.",
    how: "We structure partnerships around the strengths and objectives of each party, creating a clear alignment between the opportunity, the development model and the interests invested in its success.",
    howPoints: [
      { icon: "people", label: "Align", text: "Align objectives and investment interests." },
      { icon: "chart", label: "Structure", text: "Create the right development and commercial model." },
      { icon: "handshake", label: "Collaborate", text: "Work together through design, delivery and asset creation." },
      { icon: "chart", label: "Deliver", text: "Realise long-term value for all partners." },
    ],
    whoPoints: [
      { icon: "person", label: "Investors", text: "Access institutional-grade development opportunities with us." },
      { icon: "building", label: "Occupiers", text: "Secure tailored solutions through strategic collaboration." },
      { icon: "people", label: "Strategic Partners", text: "Combine capabilities to unlock greater value together." },
      { icon: "coins", label: "Capital Partners", text: "Participate in well-structured, future-ready assets." },
    ],
    cta: "Explore Opportunities",
    image: "/how-we-3.webp",
    visualCue: "Interests aligned",
    caption: "Align interests around shared value",
  },
];

function PathwayPoints({ points, divided = false }: { points: PathwayPoint[]; divided?: boolean }) {
  return (
    <ul className={`partner-points${divided ? " partner-points-divided" : ""}`}>
      {points.map((point) => (
        <li key={point.label}>
          <i>
            <PathwayIcon name={point.icon} />
          </i>
          <b>{point.label}</b>
          <span>{point.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function PartnerJourney() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.utils
        .toArray<HTMLElement>(".partner-chapter")
        .forEach((chapter, index) =>
          ScrollTrigger.create({
            trigger: chapter,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (self.isActive) setActive(index);
            },
          }),
        );
    }, root);
    return () => context.revert();
  }, []);
  return (
    <section ref={root} className="partner-journey">
      <div className="partner-visual">
        <div className="partner-visual-meta">
          <span>Aureum / Engagement Pathways</span>
        </div>
        <div className="partner-media" aria-hidden="true">
          {partnerships.map((item, index) => (
            <div
              className={`partner-media-image ${active === index ? "active" : ""}`}
              key={item.image}
            >
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={75}
              />
            </div>
          ))}
          <div className="partner-media-shade" />
          <div className="partner-media-label" key={active}>
            <b>{partnerships[active].visualCue}</b>
          </div>
        </div>
        <p>{partnerships[active].caption}</p>
      </div>
      <div className="partner-chapters">
        {partnerships.map((item) => (
          <article className="partner-chapter" id={item.id} key={item.n}>
            <div className="partner-chapter-media" aria-hidden="true">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="100vw"
                quality={75}
              />
              <div className="partner-chapter-media-shade" />
              <span>{item.visualCue}</span>
            </div>
            <Eyebrow>
              {item.n} / {item.title}
            </Eyebrow>
            <h2>{item.headline}</h2>
            <div className="partner-chapter-details">
              <section>
                <h3>How it works</h3>
                <p>{item.how}</p>
                <PathwayPoints points={item.howPoints} />
                <div className="partner-proposition" aria-hidden="true">
                  <svg
                    className="partner-proposition-bracket"
                    viewBox="0 0 400 24"
                    preserveAspectRatio="none"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M0.5 0v8a6 6 0 0 0 6 6h187.5a6 6 0 0 1 6 6v3.5M399.5 0v8a6 6 0 0 1-6 6H206a6 6 0 0 0-6 6v3.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <span>
                    <PathwayIcon name="layers" /> Development Proposition
                  </span>
                </div>
              </section>
              <section>
                <h3>Who this is for</h3>
                <PathwayPoints points={item.whoPoints} divided />
              </section>
            </div>
            <div className="partner-chapter-footer">
              <ArrowLink href="/contact" dark>
                {item.cta}
              </ArrowLink>
              <p>
                <span /> Industrial Potential. Realised.
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PartnerConvergence() {
  return (
    <section className="partner-convergence">
      <PartnerSystemGraphic />
      <div>
        <Eyebrow>The Aureum System in Action</Eyebrow>
        <h2>A disciplined system creates repeatable excellence.</h2>
        <p>
          The Aureum System connects intelligence, governance and execution into
          one coherent approach, reducing complexity while increasing confidence.
          Regardless of the engagement model, every development follows the same
          disciplined framework.
        </p>
      </div>
    </section>
  );
}
