"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export function ContactMotion() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      const fields = gsap.utils.toArray<HTMLElement>(".strategic-form .field");
      const contactForm = document.querySelector<HTMLElement>(".contact-form");
      if (fields.length && contactForm) {
        gsap.from(fields, {
          opacity: 0,
          y: 25,
          stagger: 0.07,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: contactForm, start: "top 70%" },
        });
      }
    });
    return () => context.revert();
  }, []);
  return null;
}
