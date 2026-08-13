"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLink, Eyebrow } from "./ui";
import { models, phases, pillars } from "@/data/site";

gsap.registerPlugin(ScrollTrigger);

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function IndustrialField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const node = canvas.current;
    if (!node || reduced) return;
    const context = node.getContext("2d");
    if (!context) return;
    let frame = 0;
    let raf = 0;
    let pointerX = 0;
    let pointerY = 0;
    let inView = true;
    let resizeFrame = 0;
    const precisePointer = matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const resize = () => {
      const ratio = Math.min(devicePixelRatio, 1.5);
      node.width = innerWidth * ratio;
      node.height = innerHeight * ratio;
      node.style.width = `${innerWidth}px`;
      node.style.height = `${innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event: PointerEvent) => {
      pointerX = event.clientX / innerWidth - 0.5;
      pointerY = event.clientY / innerHeight - 0.5;
    };
    const shouldRun = () => inView && !document.hidden;
    const start = () => {
      if (!raf && shouldRun()) raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const visibility = () => (shouldRun() ? start() : stop());
    const queueResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resize();
        start();
      });
    };
    const draw = () => {
      raf = 0;
      if (!shouldRun()) return;
      frame += 0.004;
      context.clearRect(0, 0, innerWidth, innerHeight);
      context.save();
      context.translate(
        innerWidth * 0.58 + pointerX * 16,
        innerHeight * 0.51 + pointerY * 12,
      );
      context.rotate(-0.16);
      const spacing = Math.max(54, innerWidth / 24);
      context.strokeStyle = "rgba(187,195,210,.12)";
      context.lineWidth = 1;
      for (let x = -innerWidth; x < innerWidth; x += spacing) {
        context.beginPath();
        context.moveTo(x, -innerHeight);
        context.lineTo(x, innerHeight);
        context.stroke();
      }
      for (let y = -innerHeight; y < innerHeight; y += spacing) {
        context.beginPath();
        context.moveTo(-innerWidth, y);
        context.lineTo(innerWidth, y);
        context.stroke();
      }
      context.strokeStyle = "rgba(183,154,88,.55)";
      for (let i = 0; i < 9; i++) {
        const x = (i - 4) * spacing * 1.7;
        const height = 34 + (Math.sin(frame * 2 + i) + 1) * 24;
        context.strokeRect(x, -height / 2, spacing * 1.05, height);
      }
      context.beginPath();
      context.arc(
        0,
        0,
        Math.min(innerWidth, innerHeight) * 0.27,
        frame,
        frame + Math.PI * 1.55,
      );
      context.stroke();
      context.restore();
      raf = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (shouldRun()) start();
        else stop();
      },
      { rootMargin: "120px 0px" },
    );
    resize();
    observer.observe(node);
    start();
    addEventListener("resize", queueResize, { passive: true });
    if (precisePointer)
      addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stop();
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      removeEventListener("resize", queueResize);
      if (precisePointer) removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [reduced]);
  return (
    <canvas ref={canvas} className="industrial-field" aria-hidden="true" />
  );
}

export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-hero-line]", {
        yPercent: 110,
        duration: 1.15,
        stagger: 0.12,
        ease: "power4.out",
      });
      gsap.from("[data-hero-follow]", {
        opacity: 0,
        y: 22,
        duration: 0.9,
        stagger: 0.12,
        delay: 0.55,
        ease: "power3.out",
      });
      gsap.to(".hero-content", {
        yPercent: 14,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(".industrial-field", {
        scale: 1.12,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, root);
    return () => context.revert();
  }, []);
  return (
    <section ref={root} className="hero">
      <IndustrialField />
      <div className="hero-grid" />
      <div className="hero-content">
        <div data-hero-follow>
          <Eyebrow>The 360° Industrial Developer</Eyebrow>
        </div>
        <h1 aria-label="With us, industrial opportunities take shape into developments.">
          <span className="hero-line">
            <span data-hero-line>With us, industrial opportunities</span>
          </span>
          <span className="hero-line">
            <span data-hero-line>
              take shape into <em>developments.</em>
            </span>
          </span>
        </h1>
        <div className="hero-bottom" data-hero-follow>
          <div>
            <p>
              Opportunities begin with clarity, and intelligence informs every
              stage of industrial development.
            </p>
            <p className="hero-subheadline">
              The 360° Industrial Developer. From opportunity to sustainable
              long-term performance
            </p>
          </div>
          <div>
            <ArrowLink href="#system">Explore The Aureum System</ArrowLink>
            <Link href="/contact" className="text-link">
              Start a Conversation ↗
            </Link>
          </div>
        </div>
      </div>
      <div className="scroll-cue" data-hero-follow>
        Scroll to explore <i />
      </div>
    </section>
  );
}

export function AureumSystemStory() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".system-step").forEach((step, index) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActive(index);
          },
        });
      });
    }, root);
    return () => context.revert();
  }, []);
  return (
    <section ref={root} id="system" className="system-story">
      <div className="system-sticky">
        <div className="system-copy">
          <Eyebrow>01 / The Aureum System</Eyebrow>
          <h2>
            Better development starts with <em>integrated thinking.</em>
          </h2>
          <p>
            Every development is shaped by interconnected decisions. The Aureum
            System brings strategic thinking, commercial insight and disciplined
            execution into one integrated framework—where every decision
            strengthens the next.
          </p>
          <ArrowLink href="/how-we-partner" dark>
            Discover How We Partner
          </ArrowLink>
        </div>
        <div className="system-visual">
          <div
            className={`mobile-system-instrument stage-${active + 1}`}
            aria-hidden="true"
          >
            <div className="mobile-system-field">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <span />
              <span />
              <span />
              <b />
              <b />
              <b />
            </div>
            <div className="mobile-system-core">
              360°<small>Perspective</small>
            </div>
            <div className="mobile-system-state">
              <span>Signals</span>
              <span>Strategy</span>
              <span>Asset</span>
            </div>
            <small className="mobile-system-count">0{active + 1} / 03</small>
          </div>
          <div
            className={`system-masterplan stage-${active + 1}`}
            aria-hidden="true"
          >
            <div className="plan-meta">
              <span>From opportunity signals to developed asset</span>
              <span>Conceptual development study</span>
            </div>
            <div className="plan-explanation">
              <small>
                {
                  [
                    "INPUT / MARKET + LAND + DEMAND",
                    "PROCESS / ALIGN REQUIREMENTS",
                    "OUTPUT / DELIVERABLE ASSET",
                  ][active]
                }
              </small>
              <strong>
                {
                  [
                    "Identify the opportunity",
                    "Shape the development strategy",
                    "Govern the development into reality",
                  ][active]
                }
              </strong>
            </div>
            <svg viewBox="0 0 820 620" role="presentation">
              <g className="survey-grid">
                <path d="M70 90H750M70 170H750M70 250H750M70 330H750M70 410H750M70 490H750M150 50V560M250 50V560M350 50V560M450 50V560M550 50V560M650 50V560" />
              </g>
              <path
                className="site-boundary"
                d="M137 112L631 74L730 223L667 505L238 548L89 365Z"
              />
              <g className="access-infrastructure">
                <path
                  className="access-road-edge"
                  d="M23 520L210 405L395 346L790 108"
                />
                <path
                  className="access-road"
                  d="M20 500L202 389L386 330L782 91"
                />
                <path className="site-entry" d="M190 397L238 453" />
              </g>
              <g className="opportunity-signals">
                <circle cx="137" cy="112" r="6" />
                <circle cx="631" cy="74" r="6" />
                <circle cx="730" cy="223" r="6" />
                <circle cx="667" cy="505" r="6" />
                <circle cx="238" cy="548" r="6" />
                <circle cx="89" cy="365" r="6" />
                <circle cx="391" cy="217" r="6" />
                <circle cx="542" cy="371" r="6" />
              </g>
              <g className="signal-labels">
                <text x="112" y="94">
                  LAND
                </text>
                <text x="642" y="66">
                  ACCESS
                </text>
                <text x="688" y="211">
                  DEMAND
                </text>
                <text x="397" y="207">
                  COMMERCIAL
                </text>
              </g>
              <g className="strategy-routes">
                <path d="M89 365L391 217L730 223M137 112L391 217L542 371L667 505M238 548L542 371L631 74" />
                <path
                  className="primary-route"
                  d="M108 430L256 347L438 310L696 145"
                />
              </g>
              <g className="development-plots">
                <path d="M171 164L333 143L370 235L207 270Z" />
                <path d="M395 125L582 107L618 205L430 226Z" />
                <path d="M245 304L424 264L461 384L279 423Z" />
                <path d="M486 251L657 226L632 405L504 414Z" />
                <path d="M309 449L477 413L548 497L349 518Z" />
              </g>
              <g className="plot-labels">
                <text x="230" y="211">
                  01
                </text>
                <text x="468" y="177">
                  02
                </text>
                <text x="326" y="351">
                  03
                </text>
                <text x="554" y="332">
                  04
                </text>
                <text x="401" y="476">
                  05
                </text>
              </g>
              <g className="building-cores">
                <path d="M189 181L320 165L343 222L216 246Z" />
                <path d="M418 145L566 130L588 190L439 205Z" />
                <path d="M270 320L409 289L434 369L292 399Z" />
                <path d="M511 273L627 256L610 383L521 389Z" />
                <path d="M338 462L466 435L512 486L363 502Z" />
              </g>
              <g className="asset-labels">
                <text x="224" y="213">
                  LOGISTICS
                </text>
                <text x="458" y="178">
                  DISTRIBUTION
                </text>
                <text x="310" y="351">
                  OPERATIONS
                </text>
                <text x="539" y="329">
                  WAREHOUSING
                </text>
                <text x="383" y="474">
                  SUPPORT
                </text>
              </g>
            </svg>
            <div className="plan-stage">
              <strong>0{active + 1}</strong>
              <span>
                {
                  [
                    "Signals reveal where opportunity exists",
                    "Requirements align into a development plan",
                    "The plan resolves into a deliverable asset",
                  ][active]
                }
              </span>
            </div>
            <div className="plan-flow" aria-hidden="true">
              <span className={active === 0 ? "active" : ""}>Signals</span>
              <i />
              <span className={active === 1 ? "active" : ""}>Strategy</span>
              <i />
              <span className={active === 2 ? "active" : ""}>Asset</span>
            </div>
            <div className="plan-legend">
              <span className="legend-signal">
                <i /> Opportunity signal
              </span>
              <span className="legend-route">
                <i /> Access & circulation
              </span>
              <span className="legend-plot">
                <i /> Development plot
              </span>
              <span className="legend-asset">
                <i /> Industrial asset
              </span>
            </div>
          </div>
          <div className="system-active-copy">
            <small>{pillars[active].n} / 03</small>
            <h3>{pillars[active].title}</h3>
            <p>{pillars[active].body}</p>
          </div>
        </div>
      </div>
      <div className="system-steps">
        {pillars.map((pillar, index) => (
          <div
            className={`system-step ${active === index ? "active" : ""}`}
            key={pillar.n}
          >
            <span>{pillar.n}</span>
            <h3>{pillar.title}</h3>
            <p>{pillar.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AureumSystemIntroduction() {
  return (
    <section className="system-introduction">
      <div>
        <Eyebrow>01 / The Aureum System</Eyebrow>
        <h2>
          Better development starts with <em>integrated thinking.</em>
        </h2>
      </div>
      <div>
        <p>
          Every development is shaped by interconnected decisions. The Aureum
          System brings strategic thinking, commercial insight and disciplined
          execution into one integrated framework—where every decision
          strengthens the next.
        </p>
        <ArrowLink href="/how-we-partner" dark>
          Discover How We Partner
        </ArrowLink>
      </div>
    </section>
  );
}

export function LifecycleStory() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
      () => {
        const cards = gsap.utils.toArray<HTMLElement>(
          ".lifecycle-card",
          track.current,
        );
        const tween = gsap.to(track.current, {
          x: () => -(track.current!.scrollWidth - innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${track.current!.scrollWidth}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) =>
              setActive(Math.min(5, Math.floor(self.progress * 6))),
          },
        });
        cards.forEach((card) =>
          gsap.from(card.querySelectorAll("h3,p"), {
            opacity: 0.25,
            y: 35,
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: "left 75%",
              end: "left 42%",
              scrub: true,
            },
          }),
        );
      },
    );
    media.add("(max-width: 900px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>(
        ".lifecycle-card",
        track.current,
      );
      cards.forEach((card, index) =>
        ScrollTrigger.create({
          trigger: card,
          start: "top 45%",
          end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive) setActive(index);
          },
        }),
      );
    });
    return () => media.revert();
  }, []);
  return (
    <section ref={root} className="lifecycle">
      <div className="lifecycle-top">
        <div>
          <Eyebrow>02 / Development Perspective</Eyebrow>
          <h2>
            Development looks different when you see the <em>whole picture.</em>
          </h2>
        </div>
        <p>
          Aureum brings a 360° perspective to shaping developments with strategy
          and positioning them for long-term performance.
        </p>
        <div className="lifecycle-progress">
          <span
            style={
              {
                "--progress": `${((active + 1) / 6) * 100}%`,
              } as React.CSSProperties
            }
          />
          <b>0{active + 1} / 06</b>
        </div>
      </div>
      <div className="lifecycle-mobile-progress" aria-hidden="true">
        <div>
          {phases.map(([n], index) => (
            <i className={index <= active ? "active" : ""} key={n} />
          ))}
        </div>
        <span>0{active + 1} / 06</span>
      </div>
      <div ref={track} className="lifecycle-track">
        {phases.map(([n, title, body], index) => (
          <article className="lifecycle-card" key={n}>
            <div className="lifecycle-orbit">
              <span>{n}</span>
              <i style={{ transform: `rotate(${index * 60}deg)` }} />
            </div>
            <small>Phase {n}</small>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EngagementModels() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.from(".engagement-heading > *", {
        opacity: 0,
        y: 35,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 72%" },
      });
      gsap.from(".engagement-panel", {
        opacity: 0,
        y: 50,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".engagement-panels", start: "top 78%" },
      });
    }, root);
    return () => context.revert();
  }, []);
  return (
    <section ref={root} className="engagement section">
      <div className="engagement-heading">
        <Eyebrow>03 / How We Partner</Eyebrow>
        <h2>
          The right development approach is never predefined.{" "}
          <em>The opportunity shapes the way we develop.</em>
        </h2>
      </div>
      <div className="engagement-panels" onMouseLeave={() => setActive(0)}>
        {models.map((model, index) => (
          <article
            className={`engagement-panel ${active === index ? "active" : ""}`}
            key={model.n}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
          >
            <div className="engagement-index">
              <span>{model.n}</span>
              <i />
            </div>
            <div className="engagement-panel-copy">
              <small>{["Originate", "Develop", "Align"][index]}</small>
              <h3>{model.title}</h3>
              <strong>{model.lead}</strong>
              <p>{model.body}</p>
              <Link href="/how-we-partner">
                Explore model <b>↗</b>
              </Link>
            </div>
            <div className="engagement-geometry" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>{model.n}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomepageReveals() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.utils
        .toArray<HTMLElement>(".project-grid > a")
        .forEach((item, index) => {
          gsap.from(item, {
            opacity: 0,
            y: 55 + index * 8,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 88%" },
          });
          const media = item.querySelector(".media-lines");
          if (media)
            gsap.fromTo(
              media,
              { scale: 1.12 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: item,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.8,
                },
              },
            );
        });
      gsap.from(".article-list > a", {
        opacity: 0,
        x: 35,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".article-list", start: "top 82%" },
      });
      gsap.from(".connect > *", {
        opacity: 0,
        y: 38,
        stagger: 0.14,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".connect", start: "top 75%" },
      });
      gsap.from("footer .footer-grid > div", {
        opacity: 0,
        y: 24,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: "footer", start: "top 90%" },
      });
      gsap.to(".footer-orbit", {
        rotation: 35,
        y: -35,
        ease: "none",
        scrollTrigger: {
          trigger: "footer",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      });
    });
    return () => context.revert();
  }, []);
  return null;
}
