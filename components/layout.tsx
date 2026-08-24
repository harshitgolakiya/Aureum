"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FooterContent } from "@/lib/cms/schema";

const links = [
  ["Who We Are", "/who-we-are"],
  ["How We Partner", "/how-we-partner"],
  ["Portfolio", "/portfolio"],
  ["Insights", "/insights"],
  ["Contact", "/contact"],
];

type SocialName = "LinkedIn" | "Instagram" | "Facebook";

function SocialIcon({ name }: { name: SocialName }) {
  if (name === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5" cy="5" r="1.5" />
        <path d="M3.5 9v11M8.5 20V9m0 4.8c1.2-3.1 6.8-3.4 6.8 1.8V20M15.3 15.6V20" />
      </svg>
    );
  }
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle className="social-icon-dot" cx="17.5" cy="6.5" r="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 21v-8h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7H18V3.8c-.6-.1-1.7-.3-2.8-.3-2.8 0-4.7 1.7-4.7 4.8V10H8v3h2.5v8" />
    </svg>
  );
}

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
  if (pathname.startsWith("/admin")) return null;
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

export function Footer({ content }: { content: FooterContent }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  const socialLinks = (
    [
      ["LinkedIn", content.linkedinUrl],
      ["Instagram", content.instagramUrl],
      ["Facebook", content.facebookUrl],
    ] as const
  ).filter((item): item is readonly [SocialName, string] => Boolean(item[1]));
  return (
    <footer id="site-footer">
      <div className="footer-orbit" aria-hidden="true" />
      <div className="footer-lead">
        <div className="footer-brand">
          <Image
            className="footer-logo"
            src="/aureumLogo.svg"
            width={308}
            height={94}
            alt="Aureum"
            unoptimized
          />
          <p>
            {content.brandStatement}
          </p>
        </div>
        <Link className="footer-cta" href="/contact">
          <small>Have an industrial opportunity?</small>
          <span>Start a conversation</span>
          <b aria-hidden="true">↗</b>
        </Link>
      </div>
      <div className="footer-grid">
        <div className="footer-column">
          <small className="footer-label">Explore</small>
          <nav className="footer-links" aria-label="Footer navigation">
            {links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="footer-column">
          <small className="footer-label">Address</small>
          <address>
            {content.addressOne}
            <br />
            {content.addressTwo}
            <br />
            {content.addressThree}
            <br />
            {content.addressFour}
          </address>
        </div>
        <div className="footer-contact footer-column">
          <small className="footer-label">Contact</small>
          <a href={`mailto:${content.primaryEmail}`}>{content.primaryEmail}</a>
          <a href={`mailto:${content.secondaryEmail}`}>{content.secondaryEmail}</a>
          <a href={`tel:${content.phoneHref}`}>{content.phoneDisplay}</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Aureum. All rights reserved.</span>
        <nav className="footer-socials" aria-label="Social media">
          {socialLinks.map(([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
            >
              <SocialIcon name={label} />
            </a>
          ))}
        </nav>
        <span className="footer-legal">
          <Link href="/privacy-policy">Privacy</Link> ·{" "}
          <Link href="/terms">Terms</Link> ·{" "}
          <Link href="/cookie-policy">Cookies</Link>
        </span>
      </div>
    </footer>
  );
}
