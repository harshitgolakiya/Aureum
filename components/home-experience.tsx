"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLink, Eyebrow } from "./ui";
import { models, phases } from "@/data/site";
import { homeHeroMedia } from "@/data/media";
import type { HomeHeroContent } from "@/lib/cms/schema";

gsap.registerPlugin(ScrollTrigger);

export function HomeHero({ content }: { content: HomeHeroContent }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      if (motionPreference.matches) {
        video.current?.pause();
        return;
      }
      void video.current?.play().catch(() => undefined);
    };

    syncPlayback();
    motionPreference.addEventListener("change", syncPlayback);
    return () => motionPreference.removeEventListener("change", syncPlayback);
  }, []);

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
      gsap.to(".hero-photo img, .hero-photo video", {
        scale: 1.08,
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
      <div className="hero-photo" aria-hidden="true">
        <Image
          src={homeHeroMedia.posterSrc}
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <video
          ref={video}
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={homeHeroMedia.posterSrc}
          tabIndex={-1}
          disablePictureInPicture
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        >
          <source src={homeHeroMedia.videoSrc} type="video/mp4" />
        </video>
      </div>
      <div className="hero-grid" />
      <div className="hero-content">
        <div className="hero-main">
          <div className="hero-kicker" data-hero-follow>
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <p>{content.kicker}</p>
          </div>
          <h1
            aria-label={`${content.titleLineOne} ${content.titleLineTwo} ${content.titleEmphasis}`}
          >
            <span className="hero-line">
              <span data-hero-line>{content.titleLineOne}</span>
            </span>
            <span className="hero-line">
              <span data-hero-line>
                {content.titleLineTwo} <em>{content.titleEmphasis}</em>
              </span>
            </span>
          </h1>
        </div>
        <div className="hero-dock" data-hero-follow>
          <div className="hero-summary">
            <small>Our perspective</small>
            <p>{content.summary}</p>
          </div>
          <div className="hero-actions">
            <ArrowLink href="#system">Explore The Aureum System</ArrowLink>
            <Link href="/contact" className="text-link">
              Start a Conversation ↗
            </Link>
          </div>
          <ol className="hero-principles" aria-label="The Aureum approach">
            <li>
              <span>01</span> Identify
            </li>
            <li>
              <span>02</span> Shape
            </li>
            <li>
              <span>03</span> Deliver
            </li>
          </ol>
        </div>
      </div>
      <div className="scroll-cue" data-hero-follow>
        <span>Scroll</span>
        <i />
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
      const articleItems = gsap.utils.toArray<HTMLElement>(
        ".article-list > a",
      );
      if (articleItems.length) {
        gsap.from(articleItems, {
          opacity: 0,
          x: 35,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: articleItems[0].closest(".article-list") ?? articleItems[0],
            start: "top 82%",
          },
        });
      }
      const connectItems = gsap.utils.toArray<HTMLElement>(".connect > *");
      if (connectItems.length) {
        gsap.from(connectItems, {
          opacity: 0,
          y: 38,
          stagger: 0.14,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: connectItems[0].closest(".connect") ?? connectItems[0],
            start: "top 75%",
          },
        });
      }
      const footer = document.querySelector<HTMLElement>("footer");
      const footerItems = gsap.utils.toArray<HTMLElement>(
        "footer .footer-grid > div",
      );
      if (footer && footerItems.length) {
        gsap.from(footerItems, {
          opacity: 0,
          y: 24,
          stagger: 0.12,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: footer, start: "top 90%" },
        });
      }
      const footerOrbit = document.querySelector<HTMLElement>(".footer-orbit");
      if (footer && footerOrbit) {
        gsap.to(footerOrbit, {
          rotation: 35,
          y: -35,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }
    });
    return () => context.revert();
  }, []);
  return null;
}
