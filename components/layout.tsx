"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  ["Who We Are", "/who-we-are"],
  ["How We Partner", "/how-we-partner"],
  ["Portfolio", "/portfolio"],
  ["Insights", "/insights"],
  ["Contact", "/contact"],
];

const menus: Record<string, { intro: string; items: string[] }> = {
  "/how-we-partner": {
    intro:
      "Three pathways shaped around the opportunity and guided by one Aureum standard.",
    items: [
      "Predictive Development",
      "Development Management",
      "Strategic Partnerships",
    ],
  },
  "/portfolio": {
    intro:
      "Developments presented as evidence of intelligence, strategy and disciplined execution.",
    items: ["360° Developments", "All Developments", "Development Approach"],
  },
};

export function Header() {
  const pathname = usePathname();
  const usesLightHeader =
    pathname === "/contact" || pathname.startsWith("/insights/");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => setScrolled(scrollY > 24);
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) mobileMenu.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setMega(null);
        if (open) menuButton.current?.focus();
      }
      if (event.key === "Tab" && open) {
        const focusable =
          mobileMenu.current?.querySelectorAll<HTMLElement>("a");
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
    return () => removeEventListener("keydown", close);
  }, [open]);
  return (
    <header
      className={`header ${scrolled ? "is-scrolled" : ""} ${usesLightHeader ? "on-light-hero" : ""} ${mega ? "mega-active" : ""}`}
      onMouseLeave={() => setMega(null)}
    >
      <Link href="/" className="logo" aria-label="Aureum home">
        <Image
          src="/aureumLogo.svg"
          width={308}
          height={94}
          alt="Aureum — The 360° Industrial Developer"
          priority
          unoptimized
        />
      </Link>
      <nav className="desktop-nav" aria-label="Primary">
        {links.map(([label, href]) => (
          <div
            className="nav-item"
            key={href}
            onMouseEnter={() => setMega(menus[href] ? href : null)}
            onFocus={() => setMega(menus[href] ? href : null)}
          >
            <Link
              className={
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "active"
                  : ""
              }
              href={href}
              aria-haspopup={menus[href] ? "true" : undefined}
              aria-expanded={menus[href] ? mega === href : undefined}
            >
              {label}
            </Link>
          </div>
        ))}
        <Link className="nav-cta" href="/contact">
          Start a Conversation <span>↗</span>
        </Link>
      </nav>
      <button
        ref={menuButton}
        className="menu-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <span>{open ? "Close" : "Menu"}</span>
        <i />
      </button>
      <div
        ref={mobileMenu}
        id="mobile-menu"
        className={`mobile-menu ${open ? "open" : ""}`}
        aria-hidden={!open}
        inert={!open}
      >
        {links.map(([label, href], index) => (
          <Link
            className={pathname === href ? "active" : ""}
            key={href}
            href={href}
            onClick={() => setOpen(false)}
          >
            <small>0{index + 1}</small>
            {label}
          </Link>
        ))}
      </div>
      <div className={`mega-menu ${mega ? "open" : ""}`} aria-hidden={!mega}>
        {mega && (
          <>
            <div>
              <small>Explore Aureum</small>
              <p>{menus[mega].intro}</p>
            </div>
            <div>
              {menus[mega].items.map((item, index) => (
                <Link href={mega} key={item}>
                  <span>0{index + 1}</span>
                  {item}
                  <b>↗</b>
                </Link>
              ))}
            </div>
            <Link className="mega-all" href={mega}>
              View complete page <span>↗</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="footer-orbit" aria-hidden="true" />
      <div className="footer-grid">
        <div>
          <Image
            className="footer-logo"
            src="/aureumLogo.svg"
            width={308}
            height={94}
            alt="Aureum"
            unoptimized
          />
          <p>The 360° Industrial Developer</p>
        </div>
        <div className="footer-links">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>
        <div>
          <p>
            Aureum Development
            <br />
            Dubai, United Arab Emirates
          </p>
          <p>
            <span className="pending-value">Email pending approval</span>
            <br />
            <span className="pending-value">Telephone pending approval</span>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Aureum. All rights reserved.</span>
        <span>
          <Link href="/privacy-policy">Privacy</Link> ·{" "}
          <Link href="/terms">Terms</Link> ·{" "}
          <Link href="/cookie-policy">Cookies</Link>
        </span>
      </div>
    </footer>
  );
}
