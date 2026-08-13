"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";

export function RouteExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("aureum-intro-seen");
    if (seen || reduced) {
      const frame = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(frame);
    }
    const timeline = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem("aureum-intro-seen", "true");
        setLoading(false);
      },
    });
    timeline
      .to(".loader-line span", {
        scaleX: 1,
        duration: 1.1,
        ease: "power2.inOut",
      })
      .to(
        ".loader-index",
        {
          textContent: 360,
          duration: 0.75,
          snap: { textContent: 1 },
          ease: "none",
        },
        "<",
      )
      .to(
        ".aureum-loader",
        { clipPath: "inset(0 0 100% 0)", duration: 0.85, ease: "power4.inOut" },
        "+=.1",
      );
    return () => {
      timeline.kill();
    };
  }, []);
  useEffect(() => {
    if (loading) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(
        ".page-hero .eyebrow, .page-hero h1, .page-hero > p, .contact-hero .eyebrow, .contact-hero h1, .contact-hero > p",
        { clearProps: "all" },
      );
      return;
    }
    const context = gsap.context(() => {
      const timeline = gsap.timeline();
      timeline
        .set(".route-wipe", { display: "block", clipPath: "inset(0 0 0 0)" })
        .to(".route-wipe", {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.75,
          ease: "power4.inOut",
        })
        .from(
          ".page-hero .eyebrow, .page-hero h1, .page-hero > p, .contact-hero .eyebrow, .contact-hero h1, .contact-hero > p",
          {
            opacity: 0,
            y: 35,
            stagger: 0.08,
            duration: 0.85,
            ease: "power3.out",
          },
          "-=.35",
        )
        .set(".route-wipe", { display: "none" });
    }, shell);
    return () => context.revert();
  }, [pathname, loading]);
  const pageName =
    pathname === "/"
      ? "Aureum"
      : pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ");
  return (
    <div ref={shell} className="route-shell">
      <div className="route-wipe" aria-hidden="true">
        <span>{pageName}</span>
      </div>
      {loading && (
        <div
          className="aureum-loader"
          role="status"
          aria-label="Loading Aureum"
        >
          <div>
            <Image
              src="/aureumLogo.svg"
              width={308}
              height={94}
              alt=""
              unoptimized
            />
            <p>From opportunity to long-term performance</p>
          </div>
          <strong className="loader-index">0</strong>
          <div className="loader-line">
            <span />
          </div>
        </div>
      )}
      {children}
      <ContextCursor />
    </div>
  );
}

function ContextCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("View");
  useEffect(() => {
    if (
      !matchMedia(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    const node = cursor.current;
    if (!node) return;
    const move = (event: PointerEvent) => {
      gsap.to(node, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.22,
        ease: "power2.out",
      });
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-cursor]",
      );
      if (target) {
        node.classList.add("visible");
        setLabel(target.dataset.cursor || "View");
      } else node.classList.remove("visible");
    };
    const leave = () => node.classList.remove("visible");
    addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);
  return (
    <div ref={cursor} className="context-cursor" aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}
