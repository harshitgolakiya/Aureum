"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLink, Eyebrow, Media } from "./ui";
import type { LeaderContent } from "@/lib/cms/schema";

gsap.registerPlugin(ScrollTrigger);

export function WhoNarrative({ leaders }: { leaders: readonly LeaderContent[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [person, setPerson] = useState<number | null>(null);
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
          leaders[person].biographyOne,
          leaders[person].biographyTwo,
          leaders[person].biographyThree,
        ].filter(Boolean);
  return (
    <div ref={root}>
      <section className="who-shift">
        <div className="who-shift-rail">
          <span>Context</span>
          <i className="who-marker" />
          <span>Perspective</span>
        </div>
        <div data-who-reveal>
          <Eyebrow>01 / Our Perspective</Eyebrow>
          <h2>
            Industrial opportunity is changing. So is the way it needs to be
            developed.
          </h2>
        </div>
        <p data-who-reveal>
          Industrial development is becoming more complex, more interconnected
          and more commercially demanding. Aureum brings the perspectives
          required to navigate that complexity, from opportunity and strategy
          through to development and performance.
        </p>
      </section>
      <section className="who-philosophy">
        <div className="philosophy-index" aria-hidden="true">
          <span>Commercial</span>
          <span>Technical</span>
          <span>Strategic</span>
          <b>One system</b>
        </div>
        <div data-who-reveal>
          <Eyebrow>02 / Our Philosophy</Eyebrow>
          <h2>A different view demands a different way of thinking.</h2>
          <p>
            The Aureum System provides a consistent institutional framework for
            evaluating opportunities, shaping developments and pursuing
            long-term value across commercial, technical and strategic
            dimensions.
          </p>
          <blockquote>
            The Aureum System brings consistency to how we assess opportunities,
            shape developments and create long-term value.
          </blockquote>
        </div>
      </section>
      <section className="collective-feature">
        <div className="collective-portrait">
          <Media label="leadership-group-portrait.webp" />
          <span>Aureum Leadership</span>
        </div>
        <div>
          <Eyebrow>A Leadership Perspective</Eyebrow>
          <h2 className="collective-statement">
            <span>Three perspectives.</span>
            <span>One standard for</span>
            <span>development.</span>
          </h2>
          <div className="collective-copy" data-who-reveal>
            <p>
              Industrial development demands more than one discipline. Aureum’s
              leadership brings executive oversight, investment strategy and
              real estate development together around one shared approach.
            </p>
            <p>
              Their collective perspective connects commercial ambition,
              development realities and disciplined execution, creating clarity
              from the earliest opportunity through long-term performance.
            </p>
            <p>
              Together, they guide how Aureum evaluates, shapes and delivers
              every development.
            </p>
          </div>
        </div>
      </section>
      <section className="leadership">
        <div className="leadership-heading" data-who-reveal>
          <Eyebrow>03 / Leadership</Eyebrow>
          <h2>Different perspectives, shared conviction.</h2>
          <p>
            Together, we bring the experience, judgement and perspective to
            shape opportunities with clarity and purpose.
          </p>
          <small>
            Our leadership brings together commercial, engineering and
            development experience, aligned around a shared perspective on
            industrial development.
          </small>
        </div>
        <div className="leadership-list" data-who-reveal>
          {leaders.map((leader, index) => (
            <button
              className="leadership-card"
              type="button"
              key={leader.name}
              onClick={() => setPerson(index)}
              aria-label={`View ${leader.name}'s profile`}
            >
              <div className="leadership-card-visual">
                <Media label={leader.portrait} />
                <span className="leadership-card-index">0{index + 1}</span>
                <span className="leadership-card-discipline">
                  {leader.visualLabel}
                </span>
              </div>
              <div className="leadership-card-body">
                <small>{leader.role}</small>
                <strong>{leader.name}</strong>
                <div>
                  <span>{leader.discipline}</span>
                  <b aria-hidden="true">View profile ↗</b>
                </div>
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
            <Media label={`leadership-profile-portrait-0${person + 1}.webp`} />
          </div>
          <div className="bio-copy">
            <small>Leadership / 0{person + 1}</small>
            <h2 id="bio-title">{leaders[person].name}</h2>
            <h3>{leaders[person].role}</h3>
            <p className="pending-profile-line">
              {leaders[person].discipline}
            </p>
            {selectedBiography.length ? (
              selectedBiography.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
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

const partnerships = [
  {
    n: "01",
    title: "Predictive Development",
    headline: "Opportunity is where development begins.",
    overview:
      "Aureum identifies and evaluates industrial opportunities through market intelligence, commercial discipline and development insight and shapes them into assets positioned for long-term performance.",
    how: "We identify and evaluate opportunities through market intelligence, commercial assessment and development insight and bring the right conditions together to determine what should be developed and why.",
    who: "For those seeking to unlock an industrial opportunity as an occupier, landowner, investor or strategic partner.",
    cta: "Discuss an Opportunity",
    image: "/how-we-1.webp",
    visualCue: "Opportunity identified",
  },
  {
    n: "02",
    title: "Development Management",
    headline: "Developed around your requirements.",
    overview:
      "From site and strategy through to delivery and operational readiness, Aureum brings the development together around the requirements of the business it is designed to serve.",
    how: "We align site, commercial, design, engineering and delivery decisions around the occupier's operational requirements, creating a development purpose-built for how the business needs to perform.",
    who: "For occupiers and businesses seeking industrial space developed around their operational requirements, expansion plans and long-term needs.",
    cta: "Explore Development Management",
    image: "/how-we-2.webp",
    visualCue: "Requirements coordinated",
  },
  {
    n: "03",
    title: "Strategic Development Partnerships",
    headline: "The right partners shape the right opportunity.",
    overview:
      "Aureum brings complementary interests together around industrial opportunities, aligning land, capital, occupier requirements and development expertise to create shared long-term value.",
    how: "We structure partnerships around the strengths and objectives of each party, creating a clear alignment between the opportunity, the development model and the interests invested in its success.",
    who: "For investors, landowners, occupiers and strategic partners seeking to unlock industrial development opportunities together.",
    cta: "Discuss a Partnership",
    image: "/how-we-3.webp",
    visualCue: "Interests aligned",
  },
];

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
          <b>0{active + 1} / 03</b>
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
            <small>{partnerships[active].n} / 03</small>
            <b>{partnerships[active].visualCue}</b>
          </div>
        </div>
        <p>
          {
            [
              "Identify and shape opportunity",
              "Organise around operational requirements",
              "Align interests around shared value",
            ][active]
          }
        </p>
      </div>
      <div className="partner-chapters">
        {partnerships.map((item) => (
          <article className="partner-chapter" key={item.n}>
            <div className="partner-chapter-media" aria-hidden="true">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="100vw"
                quality={75}
              />
              <div className="partner-chapter-media-shade" />
              <span>{item.n} / 03</span>
            </div>
            <Eyebrow>
              {item.n} / {item.title}
            </Eyebrow>
            <h2>{item.headline}</h2>
            <p className="large-copy">{item.overview}</p>
            <div className="partner-chapter-details">
              <section>
                <small>How it works</small>
                <p>{item.how}</p>
              </section>
              <section>
                <small>Who this is for</small>
                <p>{item.who}</p>
              </section>
            </div>
            <ArrowLink href="/contact" dark>
              {item.cta}
            </ArrowLink>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PartnerConvergence() {
  return (
    <section className="partner-convergence">
      <div className="convergence-lines" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>A</span>
      </div>
      <div>
        <Eyebrow>The Aureum System in Action</Eyebrow>
        <h2>Different pathways. One Aureum standard.</h2>
        <p>
          Whichever path an opportunity takes, the same perspective, discipline
          and standards guide how it is shaped and developed.
        </p>
        <Link href="/contact">Start a conversation ↗</Link>
      </div>
    </section>
  );
}
