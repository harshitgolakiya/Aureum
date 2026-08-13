"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export function ContactMotion() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from(".contact-hero h1", {
        opacity: 0,
        y: 55,
        duration: 1.1,
        ease: "power4.out",
      });
      gsap.from(".strategic-form .field", {
        opacity: 0,
        y: 25,
        stagger: 0.07,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: ".contact-form", start: "top 70%" },
      });
      gsap.to(".map-grid", {
        x: 22,
        y: -18,
        ease: "none",
        scrollTrigger: {
          trigger: ".office",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, root);
    return () => context.revert();
  }, []);
  return <div ref={root} className="contact-motion-hook" />;
}
