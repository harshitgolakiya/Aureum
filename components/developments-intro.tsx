"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Eyebrow } from "./ui";

gsap.registerPlugin(ScrollTrigger);

const HEADING = [
  { text: "Every development reflects the ", italic: false },
  { text: "thinking behind it...", italic: true },
];
const PARAGRAPH =
  "Explore the developments that demonstrate Aureum's approach in practice.";

/* Words stay unbroken (nowrap) so lines wrap between words, never mid-word. */
function Chars({ text }: { text: string }) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word, index) => (
      <span key={`${word}-${index}`}>
        <span className="dev-intro-word">
          {[...word].map((char, i) => (
            <span className="dev-intro-char" key={i} aria-hidden="true">
              {char}
            </span>
          ))}
        </span>{" "}
      </span>
    ));
}

export function DevelopmentsIntro() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const chars = gsap.utils.toArray<HTMLElement>(
        ".dev-intro-char",
        section,
      );
      const bar = section.querySelector<HTMLElement>(".dev-intro-progress i");

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });
      // Every character darkens in reading order across ~85% of the scroll,
      // leaving the last stretch as a hold with the text fully solid.
      timeline.fromTo(
        chars,
        { opacity: 0.14 },
        {
          opacity: 1,
          duration: 0.12,
          stagger: { amount: 0.78 },
        },
        0.03,
      );
      if (bar) timeline.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    });

    return () => media.revert();
  }, []);

  return (
    <section className="dev-intro" ref={root}>
      <div className="dev-intro-stage">
        <div className="dev-intro-inner">
          <Eyebrow>Selected Developments</Eyebrow>
          <h2
            className="dev-intro-heading"
            aria-label={HEADING.map((part) => part.text).join("").trim()}
          >
            {HEADING.map((part) =>
              part.italic ? (
                <em key={part.text}>
                  <Chars text={part.text} />
                </em>
              ) : (
                <Chars key={part.text} text={part.text} />
              ),
            )}
          </h2>
          <p className="dev-intro-copy" aria-label={PARAGRAPH}>
            <Chars text={PARAGRAPH} />
          </p>
        </div>
        <div className="dev-intro-progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}
