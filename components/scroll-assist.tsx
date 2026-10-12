"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Mode = "down" | "up";

/**
 * Floating scroll control in the bottom-right corner. Near the top of a page it
 * points down and jumps to the next section; once the visitor has scrolled a
 * screen it points up and returns to the top.
 */
export function ScrollAssist() {
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>("down");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - innerHeight;
      setReady(scrollable > innerHeight * 0.5);
      setMode(scrollY > innerHeight * 0.6 ? "up" : "down");
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    // The page grows after the intro and route transitions finish, so watch its size too.
    const observer = new ResizeObserver(onScroll);
    observer.observe(document.body);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, [pathname]);

  if (pathname.startsWith("/admin") || !ready) return null;

  const behavior: ScrollBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const nextSection = () => {
    const header = document.querySelector<HTMLElement>(".header");
    const offset = (header?.offsetHeight ?? 0) + 8;
    const candidates = Array.from(document.querySelectorAll<HTMLElement>("#main-content section, #main-content article, #main-content [data-scroll-stop]"));
    const current = scrollY + offset;
    const target = candidates
      .map((element) => element.getBoundingClientRect().top + scrollY)
      .filter((top) => top > current + 24)
      .sort((a, b) => a - b)[0];
    scrollTo({ top: target !== undefined ? target - offset : scrollY + innerHeight * 0.9, behavior });
  };

  const toTop = () => scrollTo({ top: 0, behavior });

  return (
    <button
      type="button"
      className={`scroll-assist scroll-assist-${mode}`}
      onClick={mode === "down" ? nextSection : toTop}
      aria-label={mode === "down" ? "Scroll to the next section" : "Back to top"}
      title={mode === "down" ? "Scroll down" : "Back to top"}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M6 13l6 6 6-6" />
      </svg>
    </button>
  );
}
