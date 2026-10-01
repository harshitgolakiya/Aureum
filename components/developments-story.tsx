"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLink } from "./ui";

gsap.registerPlugin(ScrollTrigger);

export type DevelopmentStory = {
  slug: string;
  name: string;
  location: string;
  image: string;
  headline: string;
  subline: string;
  specs: string;
  tagline: string;
  taglineSub: string;
  closing: string;
  services: string;
};

function toLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseSpecs(specs: string) {
  return toLines(specs).map((line) => {
    const split = line.indexOf(":");
    return split > 0
      ? { label: line.slice(0, split).trim(), value: line.slice(split + 1).trim() }
      : { label: "", value: line };
  });
}

function Lines({ value }: { value: string }) {
  return toLines(value).map((line, index) => (
    <span className="dev-line" key={`${line}-${index}`}>
      {line}
    </span>
  ));
}

/*
 * Each featured project is two slides driven by scroll:
 *   1. the slide image under a navy tint with the project details
 *   2. tint lifts, details leave, the finished slide image shows with its own
 *      text sliding in from the left and the CTA from the right
 * The next project wipes up over the previous one.
 */
export function DevelopmentsStory({ items }: { items: DevelopmentStory[] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const track = root.current;
    if (!track) return;
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const slides = gsap.utils.toArray<HTMLElement>(".dev-slide:not(.dev-slide-end)", track);
      const endSlide = track.querySelector<HTMLElement>(".dev-slide-end");
      const stage = track.querySelector<HTMLElement>(".dev-story-stage");
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: track,
          // The stage sticks below the header, so start when it does.
          start: () =>
            `top ${stage ? parseFloat(getComputedStyle(stage).top) || 0 : 0}px`,
          invalidateOnRefresh: true,
          end: "bottom bottom",
          scrub: 0.7,
        },
      });

      let cursor = 0;
      slides.forEach((slide, index) => {
        const picture = slide.querySelector(".dev-slide-media");
        const tint = slide.querySelector(".dev-slide-tint");
        const scrim = slide.querySelector(".dev-slide-scrim");
        const details = gsap.utils.toArray<HTMLElement>(".dev-s1-item", slide);
        const closing = gsap.utils.toArray<HTMLElement>(".dev-s2-item", slide);
        const cta = slide.querySelector(".dev-slide-cta");
        const count = slide.querySelector(".dev-slide-count");

        // Later projects wipe up over the previous one.
        if (index > 0) {
          timeline.fromTo(
            slide,
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power2.inOut" },
            cursor,
          );
          timeline.fromTo(
            picture,
            { yPercent: 14, scale: 1.14 },
            { yPercent: 0, scale: 1.06, duration: 1.1, ease: "power2.inOut" },
            cursor,
          );
          cursor += 1.1;
        }

        // Slide 1: details rise in one after another.
        timeline.fromTo(
          [...details, count],
          { autoAlpha: 0, y: 48 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.09,
            ease: "power2.out",
          },
          cursor + 0.05,
        );
        cursor += 0.55 + 0.09 * details.length + 0.9;

        // Slide 1 -> 2: details leave, tint lifts, image settles.
        timeline.to(
          details,
          { autoAlpha: 0, y: -36, duration: 0.5, stagger: 0.03, ease: "power2.in" },
          cursor,
        );
        timeline.to(tint, { opacity: 0, duration: 1.1, ease: "power1.inOut" }, cursor + 0.1);
        timeline.to(picture, { scale: 1, duration: 1.1, ease: "power1.inOut" }, cursor + 0.1);
        if (scrim) {
          timeline.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 1.1 }, cursor + 0.1);
        }
        // Slide 2 text slides in from the left, the CTA from the right.
        if (closing.length) {
          timeline.fromTo(
            closing,
            { autoAlpha: 0, x: -90 },
            { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.06, ease: "power3.out" },
            cursor + 0.8,
          );
        }
        timeline.fromTo(
          cta,
          { autoAlpha: 0, x: 120 },
          { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" },
          cursor + 1.1,
        );
        cursor += 2.6;
      });

      // Closing slide: wipes up over the last project, then the portfolio link rises in.
      const lastPicture = slides.at(-1)?.querySelector(".dev-slide-media");
      if (endSlide) {
        timeline.fromTo(
          endSlide,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power2.inOut" },
          cursor,
        );
        if (lastPicture) {
          timeline.to(lastPicture, { yPercent: -7, duration: 1.1, ease: "power2.inOut" }, cursor);
        }
        timeline.fromTo(
          ".dev-end-item",
          { autoAlpha: 0, y: 56 },
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" },
          cursor + 0.7,
        );
        cursor += 2.2;
      }

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    });

    return () => media.revert();
  }, [items]);

  return (
    <section
      className="dev-story"
      ref={root}
      style={{ "--dev-count": items.length } as React.CSSProperties}
      aria-label="Selected developments"
    >
      <div className="dev-story-stage">
        {items.map((item, index) => {
          const specs = parseSpecs(item.specs);
          return (
            <article className={`dev-slide${item.image ? "" : " dev-slide-no-image"}`} key={item.slug}>
              <div className="dev-slide-media">
                {/* Portrait screens only: soft blurred fill behind the fully shown image. */}
                {item.image && <><div className="dev-slide-backdrop" aria-hidden="true">
                  <Image src={item.image} alt="" fill sizes="25vw" />
                </div>
                <Image
                  src={item.image}
                  alt={item.headline || item.name}
                  fill
                  sizes="100vw"
                />
                </>}
              </div>
              <div className="dev-slide-tint" aria-hidden="true" />
              <div className="dev-slide-scrim" aria-hidden="true" />

              {/* Slide 1 */}
              <div className="dev-s1">
                <h3 className="dev-s1-title dev-s1-item">
                  <span>{item.headline}</span>
                  {item.subline && <em>{item.subline}</em>}
                </h3>
                {specs.length > 0 && (
                  <dl className="dev-s1-specs">
                    {specs.map((spec, specIndex) => (
                      <div className="dev-s1-item" key={`${spec.label}-${specIndex}`}>
                        {spec.label && <dt>{spec.label}:</dt>} <dd>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {/* Slide 2: top half */}
              <div className="dev-s2 dev-s2-top">
                <div>
                  {item.tagline && (
                    <h4 className="dev-s2-tagline dev-s2-item">
                      <Lines value={item.tagline} />
                    </h4>
                  )}
                  {item.taglineSub && (
                    <>
                      <i className="dev-s2-rule dev-s2-item" aria-hidden="true" />
                      <p className="dev-s2-sub dev-s2-item">
                        <Lines value={item.taglineSub} />
                      </p>
                    </>
                  )}
                </div>
                <p className="dev-s2-caption dev-s2-item">
                  <span className="dev-line">{item.name}</span>
                  {item.location && <span className="dev-line">{item.location}</span>}
                </p>
              </div>

              {/* Slide 2: bottom half */}
              <div className="dev-s2 dev-s2-bottom">
                {item.closing && (
                  <p className="dev-s2-closing dev-s2-item">
                    <Lines value={item.closing} />
                  </p>
                )}
              </div>

              <p className="dev-slide-count" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
                <span> / {String(items.length).padStart(2, "0")}</span>
              </p>
              <Link
                className="button dev-slide-cta"
                href={`/portfolio/${item.slug}`}
                aria-label={`Explore ${item.name}`}
              >
                Explore this development <span aria-hidden="true">↗</span>
              </Link>
            </article>
          );
        })}
        <div className="dev-slide dev-slide-end">
          <div className="dev-end-inner">
            <p className="dev-end-copy dev-end-item">
              Every development reflects <em>the thinking behind it.</em>
            </p>
            <div className="dev-end-item">
              <ArrowLink href="/portfolio" dark>
                Explore our development portfolio
              </ArrowLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
