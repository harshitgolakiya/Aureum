# Aureum Website — Premium Interaction & Experience Roadmap

## Purpose

This document is the implementation roadmap for evolving the current Aureum website from a strong visual foundation into a premium, highly interactive digital experience appropriate for a high-end industrial development brand and a project value of approximately **USD 20,000**.

The client feedback is clear:

> The theme, colours and fonts are good, but the website needs to be more interactive, with stronger animation and sections that move with scrolling, including canvas-based experiences.

The redesign should therefore preserve the approved visual theme while adding meaningful motion, spatial depth and scroll-driven storytelling. Interaction must explain Aureum’s philosophy rather than merely decorate the page.

---

## 1. Current-State Audit

### What is already working

- The Aureum palette feels appropriate, institutional and premium.
- Typography has strong editorial scale and hierarchy.
- The supplied Aureum logo is used in the header and footer.
- Page structure broadly follows the supplied content document.
- The homepage follows the intended narrative sequence:
  statement → thinking → process → partnership → evidence → intelligence → conversation.
- Supporting routes and templates exist for Who We Are, How We Partner, Portfolio, Insights, Contact and legal pages.
- Responsive layouts, reduced-motion CSS and foundational SEO routes exist.
- The project passes linting, TypeScript and a production build.

### What currently prevents a premium-agency result

- Most page content is static after initial render.
- There is no shared reveal or scroll-animation system.
- The homepage hero has no cinematic media or interactive visual layer.
- The Aureum System diagram does not draw, rotate or change content with scroll progress.
- The 360° lifecycle is a normal horizontal scroll area instead of a controlled pinned sequence.
- Sections do not transition spatially into one another.
- Portfolio cards have limited image behavior and no premium cursor treatment.
- Portfolio filters are visual only and do not filter data.
- Project pages do not include gallery, lightbox, progress or chapter transitions.
- Insights pages do not include reading progress, article reveals or related-story interaction.
- Page heroes repeat one static treatment instead of having route-specific motion identities.
- There is no page-transition system.
- The contact form interaction is basic and its confirmation is not cinematic.
- There is no canvas/WebGL experience.
- Placeholder media is necessary, but currently makes too much of the site feel like a styled wireframe.

---

## 2. Experience Principles

Every improvement must follow these rules.

### Motion must communicate meaning

- Intelligence is represented through points, coordinates, fields and signals.
- Strategy is represented through alignment, convergence and connected paths.
- Execution is represented through structure, sequencing and resolved geometry.
- The 360° perspective is represented through continuous motion, rotation and changing viewpoints.

### Premium means controlled

- Use long, composed easing rather than bounce or exaggerated springs.
- Use animation hierarchy: primary story movement, secondary reveals, restrained micro-interactions.
- Do not animate every element.
- Avoid generic fade-up animation repeated across the entire site.
- Avoid flashy particles, neon, excessive 3D, glowing effects or “tech startup” visuals.

### Scroll should feel natural

- Native scrolling remains the foundation.
- Scroll-linked animation must not trap the user.
- Pinned sequences need clear progress and predictable exit points.
- Mobile receives simplified vertical alternatives, not compressed desktop animation.
- All major experiences must work with `prefers-reduced-motion`.

### Performance is part of the design

- Canvas and WebGL are loaded only where they add real value.
- The rest of the site should use CSS transforms, SVG and the Web Animations API or GSAP.
- Avoid running animation loops when sections are outside the viewport.
- Pause visual effects when the tab is hidden.
- Do not sacrifice readability, input responsiveness or Core Web Vitals.

---

## 3. Recommended Technical Motion Stack

### Core animation

- **GSAP + ScrollTrigger** for pinned storytelling, scrubbed timelines, text sequencing and coordinated section transitions.
- A small reusable React animation layer so timelines are created and cleaned up safely.
- `gsap.matchMedia()` for desktop, tablet, mobile and reduced-motion variants.

### Smoothness

- Begin with native scrolling and GSAP’s scroll integration.
- Consider Lenis only after interaction prototypes are stable and accessibility/testing confirms that it improves rather than harms the experience.
- Never use smooth scrolling on form controls, keyboard navigation or reduced-motion mode.

### Canvas/WebGL

- Use **Three.js with React Three Fiber** only for the signature Aureum canvas experience.
- Dynamically import it client-side.
- Provide a static SVG/poster fallback for reduced motion, weak devices, unsupported browsers and initial loading.
- Limit device pixel ratio and visual complexity on mobile.

### Supporting utilities

- Split text into accessible line wrappers without duplicating screen-reader content.
- Use Intersection Observer for lightweight off-screen activation.
- Use CSS custom properties for progress values and shared motion tokens.

The final package choice should be confirmed during the interaction prototype. GSAP is recommended because the primary requirement is controlled scroll choreography rather than application UI animation.

---

## 4. Signature Experiences

These are the features that will make the site memorable and justify premium production value.

### Signature Experience A — Interactive Industrial Field Hero

**Location:** Homepage hero

Build a full-viewport canvas/WebGL environment inspired by masterplans, industrial grids and architectural massing.

Behavior:

- A field of fine technical lines and development “plots” sits behind the hero copy.
- Pointer movement subtly changes perspective on desktop.
- As the page begins scrolling, scattered coordinates align into a coherent development structure.
- The headline reveals by line with a restrained mask transition.
- Supporting copy and CTAs follow in a deliberate sequence.
- The visual field resolves toward the first Aureum System section, creating continuity instead of a hard cut.
- When official video becomes available, the canvas can become a controlled overlay or transition layer over the video.

Fallback:

- Static architectural SVG field and normal text layout.

Acceptance criteria:

- Stable at 55–60 FPS on a typical modern laptop.
- Canvas does not delay readable hero content.
- Pointer motion is subtle and disabled on touch/reduced-motion devices.
- Hero remains attractive if WebGL fails.

### Signature Experience B — The Aureum System Scroll Story

**Location:** Homepage Section 02 and adapted on Who We Are

Replace the static system diagram with a pinned, multi-stage sequence.

Scroll stages:

1. The core 360° circle draws itself.
2. Industrial Intelligence appears as signals/data points entering the system.
3. Development Strategy connects and aligns those points.
4. Disciplined Execution resolves the paths into a precise structural form.
5. All three pillars illuminate together as one complete Aureum System.
6. The completed system opens into the development lifecycle section.

Content behavior:

- The active pillar changes copy, accent color intensity and diagram state.
- A vertical progress indicator shows the current stage.
- The left editorial statement remains stable while the right visual evolves.
- On mobile, use a vertical sequence with a sticky compact diagram rather than a long pinned desktop scene.

Acceptance criteria:

- Each scroll stage clearly explains one pillar.
- No content is hidden without JavaScript.
- Keyboard and reduced-motion users receive the full content in logical order.

### Signature Experience C — 360° Development Lifecycle Journey

**Location:** Homepage Section 03

Transform the current horizontal scroller into a desktop pinned sequence driven by vertical scroll.

Behavior:

- The viewport pins while six lifecycle phases move horizontally.
- A circular 360° progress instrument rotates as each phase becomes active.
- Background structure, coordinates and visual scale evolve between phases.
- Text and visuals transition with controlled overlap rather than simple card sliding.
- The previous and next phases remain partially visible to communicate continuity.
- A thin progress line and phase count make position obvious.

Mobile:

- Vertical timeline with a sticky phase number/progress ring.
- Each stage reveals as it enters the viewport.
- No forced horizontal swiping.

Acceptance criteria:

- The sequence begins and exits without scroll jumps.
- All six phases remain readable on small laptop heights.
- Scrolling backward reverses the story cleanly.

### Signature Experience D — Portfolio Spatial Showcase

**Location:** Homepage portfolio and Portfolio landing page

Build a more cinematic project exploration system.

Behavior:

- Featured projects move at different, restrained parallax speeds.
- Image masks open as projects enter the viewport.
- Hovering a project introduces a small custom “View” cursor and directional line motion.
- Project metadata transitions from quiet to active rather than appearing abruptly.
- Portfolio filters animate project positions using FLIP-style layout transitions.
- A selected project can expand through a shared visual transition into its detail page.

Acceptance criteria:

- All project information is accessible without hover.
- Filters genuinely change visible projects and announce results accessibly.
- Placeholder media can later be replaced without rebuilding animation logic.

### Signature Experience E — Development Case-Study Chapters

**Location:** `/portfolio/[slug]`

Turn the project detail template into a guided editorial case study.

Behavior:

- Full-bleed hero media has a slow, controlled scale-out on entry.
- A sticky chapter rail tracks Opportunity, Strategy, Delivery and Outcome.
- Each chapter changes the accompanying visual or diagram.
- Metrics count or reveal only when real approved metrics exist.
- Gallery uses full-screen lightbox navigation with image captions.
- A “next development” transition closes the story.

Do not animate placeholder metrics as though they are real data.

---

## 5. Global Experience Improvements

### 5.1 Page preloader and first visit

- Create a short branded first-load sequence using the Aureum mark and 360° line language.
- Keep it under approximately 1.5 seconds after assets are ready.
- Show it only when needed, not on every internal navigation.
- Respect reduced motion and never delay content unnecessarily.

### 5.2 Route transitions

- Add a restrained navy/gold transition layer between internal pages.
- Carry section label or route name through the transition.
- Support browser back/forward behavior.
- Do not cover up slow loading; use real loading states where required.

### 5.3 Global reveal language

Create reusable primitives:

- line-masked heading reveal;
- paragraph line reveal;
- eyebrow/rule draw;
- image clip reveal;
- staggered metadata reveal;
- number/progress reveal;
- section color transition;
- reduced-motion instant state.

Different pages should compose these primitives differently instead of repeating the same animation.

### 5.4 Navigation

- Refine transparent-to-frosted transition with smoother height and logo changes.
- Add active-route indication.
- Create premium mega menus for How We Partner and Portfolio.
- Mega menus should include short descriptions, section numbers and one visual preview.
- Animate menu opening with masks and staggered navigation lines.
- Add Escape handling, focus trapping and correct focus restoration.
- Add route transition behavior to navigation links.

### 5.5 Cursor and pointer states

- Introduce a restrained custom cursor only for portfolio/media interactions on precise-pointer devices.
- Cursor states: View, Drag, Explore and Close.
- Keep the normal cursor everywhere else.
- Disable on touch, reduced-motion and accessibility preference scenarios.

### 5.6 Buttons and text links

- Add controlled background wipe and arrow translation.
- Animate underline/rule direction based on interaction.
- Preserve visible focus states and avoid hover-only affordances.
- Provide loading/disabled/success states for form actions.

### 5.7 Footer conclusion

- Let the final CTA transition naturally into the footer.
- Add a slow system-line completion or 360° arc near the footer boundary.
- Reveal footer columns in a quiet sequence.
- Avoid making the footer another “hero.”

---

## 6. Page-by-Page Improvement Plan

## Homepage

### Hero

- Build Signature Experience A.
- Add line-by-line title reveal and timed content sequence.
- Make the scroll indicator respond to scroll progress.
- Add cinematic video support with poster and canvas fallback.
- Create a visual handoff from hero geometry into the Aureum System.

### Aureum System

- Build Signature Experience B.
- Add active pillar content rather than showing a static diagram only.
- Draw SVG/canvas paths progressively.
- Use scroll progress to control connection, rotation and illumination states.

### 360° Development Perspective

- Build Signature Experience C.
- Replace browser horizontal scrolling on desktop with vertical-scroll-driven progression.
- Add a rotating lifecycle instrument and active phase indication.
- Create unique visual language for every phase while preserving one system.

### Engagement Models

- Convert the three equal panels into an expanding architectural accordion.
- The active panel grows while adjacent panels recede.
- Transition a line/diagram between Originate, Develop and Align.
- Support click and keyboard activation in addition to hover.
- On mobile, use a vertical accordion with large numbered transitions.

### Selected Developments

- Build the homepage portion of Signature Experience D.
- Add image-mask reveal, asymmetric parallax and premium hover states.
- Introduce a controlled transition into project details.
- Keep placeholder project facts clearly marked until supplied.

### Insights

- Reveal editorial stories one at a time as the user crosses the section.
- Add image/topic preview following the active row on desktop.
- Use typographic color and rule motion instead of generic card lift.
- Add accessible focus equivalents.

### Final conversation

- Slow the pacing after the more expressive sections.
- Reveal headline across two or three measured stages.
- Add a minimal ambient line field that resolves into the footer rule.

## Who We Are

### Hero

- Create a different hero motion identity from the homepage: editorial image/video reveal with structural crop masks.
- Introduce a subtle scroll-driven scale and headline separation.

### Industrial opportunity narrative

- Turn the long narrative into a paced scroll sequence.
- Use timeline markers and contextual architectural media.
- Add restrained number/date movement only where approved content supports it.

### Aureum philosophy

- Reuse the Aureum System engine with a different emphasis: how Aureum thinks rather than what the three pillars are.
- Allow users to select pillars and inspect philosophy details.

### Founder’s perspective

- Create an editorial portrait reveal and sticky quotation treatment.
- Let quote and body copy exchange visual priority through scroll.
- Do not add a fake signature or founder information.

### Leadership

- Add portrait hover/focus reveals.
- Open biographies in an accessible editorial drawer or overlay.
- Animate between team members without losing focus position.

## How We Partner

- Give each engagement model a distinct scroll chapter.
- Use one evolving system diagram across all three chapters.
- Predictive Development: signals converge into an identified opportunity.
- Development Management: requirements organize into a controlled plan.
- Strategic Partnerships: separate nodes align around one shared outcome.
- Pin the shared diagram while content chapters move.
- Finish with “Different pathways. One Aureum standard” as a visual convergence.

## Portfolio Landing

- Implement working filters and animated layout transitions.
- Add sticky filter state after the hero.
- Use large editorial project reveals rather than a standard two-column grid throughout.
- Add cursor states, image parallax and metadata transitions.
- Add URL/query support for shareable filters if the final project volume justifies it.
- Prepare CMS-compatible project data and real image aspect-ratio definitions.

## Portfolio Detail

- Build Signature Experience E.
- Add chapter navigation and reading progress.
- Add strategy/system diagrams where approved project information supports them.
- Build cinematic gallery and lightbox.
- Add previous/next project navigation.
- Add metadata and structured data based only on supplied facts.

## Insights Landing

- Create a featured story with a scroll-responsive editorial image.
- Add category navigation and working filtering.
- Animate typography, rules and image crops with a publication-like rhythm.
- Introduce an active article preview on desktop.
- Preserve a clean, fast static list on mobile.

## Insight Article

- Add a sticky reading progress bar.
- Add sticky article metadata/author rail on wide layouts.
- Animate pull quotes and data visualisations when they enter view.
- Add share controls, related articles and next-article transition.
- Calculate reading time from real article content.
- Keep body line length within approximately 60–70 characters.

## Contact

- Animate form groups into view in a controlled sequence.
- Add floating/bottom-border label transitions without sacrificing explicit labels.
- Add field-level validation messages and error summary.
- Build a real multi-step mobile form only if testing proves it improves completion.
- Replace the current local-only confirmation with a true server response once an endpoint exists.
- Add animated confirmation line/checkmark after successful server submission.
- Make the map react subtly to section entry; use a static branded fallback until a token exists.

## Legal Pages

- Keep interaction minimal.
- Add a clean page entrance, table of contents and reading progress when approved copy exists.
- Do not spend premium animation budget on placeholder legal shells.

---

## 7. Content and Media Requirements

The interaction quality depends on appropriate source material. Request the following from the client before final polish:

- Homepage industrial development film in desktop and mobile crops.
- High-resolution hero posters.
- 6–10 images for each featured project.
- Approved project names, locations, types, metrics and case-study copy.
- Founder portrait, name and title.
- Consistent leadership portraits and approved biographies.
- Insight hero images and complete article copy.
- Approved office address and contact details.
- Map location and Mapbox approval/token.
- Official Aureum gold specification if available.
- Approved legal documents.
- Final production domain, analytics preference and form destination.

Until supplied, interaction systems should be built against explicit placeholder data without inventing claims.

---

## 8. Performance, Accessibility and Quality Targets

### Performance targets

- Lighthouse Performance target: 90+ on representative production pages after final media compression.
- LCP target: under 2.5 seconds on a reasonable mobile connection.
- CLS target: below 0.1.
- Interaction responsiveness must remain smooth while canvas is active.
- Initial JavaScript should remain controlled; WebGL loads only on routes that use it.
- Canvas pixel ratio capped appropriately, particularly on mobile/high-DPI screens.
- Videos use optimized codecs, posters, correct preload behavior and mobile alternatives.

### Accessibility targets

- WCAG 2.2 AA-oriented implementation.
- Complete keyboard navigation.
- Visible focus states.
- Reduced-motion version of every signature experience.
- Canvas carries no essential information that is unavailable in semantic HTML.
- Pinned content preserves a logical reading and tab order.
- Mobile menu and overlays trap and restore focus correctly.
- Filters and galleries announce state changes.
- Form errors are programmatically associated with fields.

### Browser/device QA

Test at minimum:

- Chrome, Safari, Firefox and Edge current versions.
- iOS Safari and Android Chrome.
- 375, 430, 768, 1024, 1280, 1440 and 1920px viewport widths.
- Short laptop viewport heights.
- Touch, mouse, keyboard and reduced-motion use.
- Lower-powered mobile behavior for the canvas scene.

---

## 9. Implementation Sequence

### Current implementation status

- [x] **Phase 0 — Baseline and visual QA:** Core spacing, overflow, responsive defects and motion tokens addressed. Rendered breakpoint QA has been performed on the primary routes.
- [x] **Phase 1 — Motion foundation:** GSAP, ScrollTrigger, reusable reveal patterns, safe cleanup and reduced-motion behavior are implemented.
- [x] **Phase 2 — Homepage hero prototype:** The interactive industrial-field canvas, typography choreography, pointer response, DPR cap and static/reduced-motion fallback are implemented.
- [x] **Phase 3 — Homepage core scroll story:** The Aureum System, 360° lifecycle journey and engagement-model interaction are implemented with desktop and mobile treatments.
- [x] **Phase 4 — Homepage evidence and editorial polish:** Portfolio, insights, final CTA and footer interactions are implemented.
- [x] **Phase 5 — Global navigation and transitions:** First-visit loader, route transitions, mega menus, mobile-menu choreography, active routes and contextual cursor states are implemented.
- [x] **Phase 6 — Supporting marketing pages:** Who We Are and How We Partner have page-specific scroll storytelling and interactive systems.
- [x] **Phase 7 — Portfolio system:** Working filters, case-study chapters, gallery/lightbox, progress and project navigation are implemented.
- [x] **Phase 8 — Insights and Contact:** Insight filters/article progress/related content and contact validation/submission states/map fallback are implemented.
- [ ] **Phase 9 — Final optimization and production QA:** Runtime optimization, reduced motion, responsive QA, metadata, error states, sitemap, production builds and automated Chrome/Edge browser audits are complete. Final Safari/Firefox/physical-device testing, Lighthouse measurement and final-media compression remain.

> **Client-content dependency:** Final photography, project facts, leadership information, articles, contact details, map credentials, legal documents and production integrations have not been supplied. Their placeholders are intentionally preserved and excluded from search indexing where appropriate.

Work through this roadmap in the order below. Each phase should be reviewed and approved before the next major phase begins.

### Phase 0 — Baseline and visual QA

- Capture screenshots/video of every current route at key breakpoints.
- Record performance and bundle baselines.
- Fix obvious spacing, overflow and content issues discovered during the audit.
- Define motion tokens: duration, easing, stagger, distance and reduced-motion behavior.

**Exit condition:** documented baseline and no fundamental responsive defects.

### Phase 1 — Motion foundation

- Install and configure the selected motion stack.
- Build reusable reveal, image-mask, progress and pinned-section utilities.
- Add safe cleanup, responsive contexts and reduced-motion handling.
- Add development tools for visualizing scroll triggers only in development.

**Exit condition:** reusable motion primitives demonstrated on a small test section without layout regressions.

### Phase 2 — Homepage hero prototype

- Prototype the canvas/WebGL industrial field.
- Validate visual direction, frame rate, fallback and load behavior.
- Add hero typography choreography and scroll handoff.

**Exit condition:** client approves the signature canvas direction before it is expanded.

### Phase 3 — Homepage core scroll story

- Build Aureum System pinned story.
- Build 360° lifecycle pinned journey.
- Build engagement-model expanding sequence.

**Exit condition:** homepage communicates thinking, process and partnership through scroll with no trapping or mobile regressions.

### Phase 4 — Homepage evidence and editorial polish

- Upgrade portfolio interactions.
- Upgrade insights interactions.
- Refine final CTA/footer transition.
- Add global section reveal variety and pacing.

**Exit condition:** complete premium homepage approved at desktop and mobile sizes.

### Phase 5 — Global navigation and transitions

- Add route transitions.
- Build mega menus.
- Refine mobile menu choreography.
- Add selected pointer/cursor interactions.

**Exit condition:** global interaction model is consistent, accessible and stable across route changes.

### Phase 6 — Supporting marketing pages

- Upgrade Who We Are.
- Upgrade How We Partner.
- Reuse the system engine with page-specific storytelling.

**Exit condition:** neither page feels like a static secondary template.

### Phase 7 — Portfolio system

- Add real filtering and transitions.
- Build full case-study chapter experience.
- Add gallery/lightbox and project-to-project navigation.

**Exit condition:** portfolio operates as evidence of Aureum’s thinking, not merely an image gallery.

### Phase 8 — Insights and Contact

- Add editorial interactions and article progress.
- Complete filtering and related content.
- Refine form validation, submission and confirmation.
- Integrate map when credentials are supplied.

**Exit condition:** both conversion and thought-leadership journeys feel complete.

### Phase 9 — Final optimization and production QA

- Profile canvas, scroll triggers, hydration and route transitions.
- Compress and validate final media.
- Run accessibility and keyboard audits.
- Run cross-browser and device testing.
- Run lint, TypeScript, tests and production build.
- Remove development markers and dead code.

**Exit condition:** launch-ready build with documented remaining content dependencies only.

---

## 10. Suggested One-by-One Work Order

When implementation begins, use this practical sequence:

- [x] 1. Motion tokens and animation utilities.
- [x] 2. Global heading and image reveal primitives.
- [x] 3. Homepage canvas hero prototype.
- [x] 4. Homepage hero production implementation.
- [x] 5. Aureum System pinned scroll story.
- [x] 6. 360° lifecycle pinned horizontal journey.
- [x] 7. Engagement-model expanding interaction.
- [x] 8. Homepage portfolio parallax and cursor treatment.
- [x] 9. Homepage insight preview behavior.
- [x] 10. Final CTA-to-footer transition.
- [x] 11. Navigation mega menus and mobile-menu refinement.
- [x] 12. Route transitions.
- [x] 13. Who We Are scroll storytelling.
- [x] 14. How We Partner evolving system diagram.
- [x] 15. Working portfolio filters.
- [x] 16. Project-detail chapters and gallery.
- [x] 17. Insights landing and article progress.
- [x] 18. Contact form validation/submission polish.
- [ ] 19. Full responsive, performance and accessibility QA. **In progress:** code-level QA, rendered breakpoint QA, automated Chrome/Edge audits, reduced-motion handling, keyboard behavior, TypeScript, ESLint and production builds pass. Safari/Firefox/physical-device and Lighthouse audits remain.

### Remaining UI and launch work

- [x] Normalize visible placeholder and pending-content states. Raw bracketed project/article text is retained in source data but now appears in the interface as consistent approval-pending labels without invented facts.
- [x] Refine leadership, office, contact and footer pending states. Public-facing bracket placeholders have been replaced by consistent approval indicators while preserving all client-content dependencies.
- [x] Standardize global control states. Filters, form actions, biography/lightbox controls and mobile touch targets now share consistent hover, focus, active, disabled and loading behavior.
- [x] Complete the final non-client editorial polish batch. Insight reading templates, data states, related-story interactions, branded map fallback, controlled legal-document states and global section boundaries are complete.
- [x] Add baseline production response hardening. Security/privacy headers, compression, social-image caching and removal of the framework signature are configured.
- [x] Run an additional rendered launch-polish audit at 390px, 1440px and reduced-motion settings. Article-header contrast and compact headline clipping defects found during the audit were corrected.
- [x] Add repeatable launch verification. `npm run verify` now checks types, lint, production compilation, representative routes, metadata endpoints, response headers, branded 404 behavior and client-content readiness.
- [x] Add deployment and environment handoff documentation in `LAUNCH_READINESS.md`, including required variables, client blockers and final external QA steps.
- [x] Add repeatable production-browser QA. Chrome and Edge now render nine representative routes at 390px and 1440px and automatically fail on page overflow, missing main landmarks, duplicate IDs, unlabeled buttons or images without alt text. The audit also caught and resolved a mobile project-detail overflow defect.
- [x] Give the primary secondary-page heroes distinct motion identities. Who We Are now uses widening perspective, How We Partner uses converging pathways, Portfolio uses masterplan plots and Insights uses opportunity signals.
- [x] Complete the dedicated mobile polish pass for the Aureum System and lifecycle at 375px and 430px widths. Added a sticky mobile system instrument, pillar-state choreography, lifecycle progress rail and phone-specific chapter pacing.
- [ ] Replace architectural placeholder compositions with approved project photography and media crops. **Presentation-ready placeholder system completed:** development, portrait, editorial and gallery variants now communicate the intended media direction. Final replacement remains dependent on approved client assets.
- [ ] Integrate approved founder and leadership portraits and biographies.
- [ ] Integrate approved insight articles, author information and editorial imagery.
- [ ] Integrate approved project facts, metrics, case-study copy and gallery captions.
- [ ] Add approved email, telephone, office address and Mapbox credentials.
- [ ] Connect the contact adapter to the approved production form endpoint and test real delivery.
- [ ] Insert approved privacy, terms and cookie documents and allow indexing only after approval.
- [ ] Test current Chrome, Safari, Firefox, Edge, iOS Safari and Android Chrome on real devices.
- [ ] Run Lighthouse and accessibility audits against the final production media and domain.
- [ ] Compress final imagery/video and confirm LCP, CLS and interaction-performance targets.
- [ ] Configure the final domain, analytics/consent preference and deployment environment.

This ordering delivers the highest-value visual improvements early while protecting time for production quality at the end.

---

## 11. Definition of “Premium Complete”

The upgrade is not complete merely because animations exist. It is complete when:

- The first 15 seconds immediately feel authored for Aureum.
- At least three homepage sections use meaningful scroll-driven storytelling.
- The canvas experience is visually distinctive but does not overpower the brand or copy.
- Each primary route has a purposeful motion identity.
- Motion remains elegant when scrolling forward or backward.
- Mobile feels intentionally designed, not like disabled desktop animation.
- The experience remains understandable with animation disabled.
- Project and article interactions work with real data.
- Navigation, filters, forms, galleries and overlays are fully accessible.
- Performance remains strong after final images and video are added.
- No invented project, team, contact, legal or market information appears.
- Final lint, TypeScript and production build checks pass.

---

## 12. Items That Should Not Be Built

To protect the premium direction, avoid:

- a canvas effect in every section;
- generic particle backgrounds;
- aggressive scroll hijacking;
- long branded loading screens on every visit;
- excessive magnetic buttons;
- animation that delays reading;
- autoplay audio;
- glowing/neon visual effects;
- bouncy spring transitions;
- decorative 3D industrial objects with no narrative purpose;
- mobile experiences dependent on hover;
- fake metrics, project details or thought-leadership content.

The result should feel like an international architecture and development practice: precise, measured, intelligent and memorable.
