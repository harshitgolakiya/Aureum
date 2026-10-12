"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Mode = "down" | "up";

/**
 * Floating scroll control in the bottom-right corner. Near the top of a page it
 * points down and jumps straight to the footer; once the visitor has scrolled
 * past about half a screen it points up and returns to the top.
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

  const toFooter = () => {
    const footer = document.querySelector<HTMLElement>("footer");
    const top = footer ? footer.getBoundingClientRect().top + scrollY : document.documentElement.scrollHeight;
    scrollTo({ top, behavior });
  };

  const toTop = () => scrollTo({ top: 0, behavior });

  return (
    <button
      type="button"
      className={`scroll-assist scroll-assist-${mode}`}
      onClick={mode === "down" ? toFooter : toTop}
      aria-label={mode === "down" ? "Scroll to the footer" : "Back to top"}
      title={mode === "down" ? "Scroll to footer" : "Back to top"}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M6 13l6 6 6-6" />
      </svg>
    </button>
  );
}
