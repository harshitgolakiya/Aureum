"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pillars } from "@/data/site";
import { Eyebrow } from "./ui";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 151;
const LAST_FRAME = FRAME_COUNT - 1;
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 720;
const FRAME_PREFIX = "/aureum/hf_20260827_062227_82de69e1-52ae-4c2d-ba05-c7399e2fdfc7_";
const POSTER = `${FRAME_PREFIX}00000.webp`;
const stageNotes = [
  "Understanding the opportunity",
  "Shaping the development",
  "Delivering the asset",
];

function frameSource(index: number) {
  return `${FRAME_PREFIX}${String(index).padStart(5, "0")}.webp`;
}

function stageForProgress(progress: number) {
  if (progress < 0.36) return 0;
  if (progress < 0.7) return 1;
  return 2;
}

function cacheLimitForDevice() {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  let limit = window.innerWidth >= 1200 ? 52 : window.innerWidth >= 700 ? 34 : 18;
  if (memory <= 4) limit = Math.min(limit, 28);
  if (memory <= 2) limit = Math.min(limit, 14);
  return limit;
}

type DecodedFrame = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release?: () => void;
};

export function AureumSequenceStory() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const progressBar = useRef<HTMLSpanElement>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const section = root.current;
    const canvasNode = canvas.current;
    const visualNode = visual.current;
    if (!section || !canvasNode || !visualNode) return;

    const context = canvasNode.getContext("2d", { alpha: false });
    if (!context) return;

    let alive = true;
    let desiredFrame = 0;
    let targetFrame = 0;
    let easedFrame = 0;
    let renderedFrame = -1;
    let direction = 1;
    let animationFrame = 0;
    let warmGeneration = 0;
    let warmFocus = -100;
    let didRevealCanvas = false;
    let currentStage = 0;
    let prefetchStarted = false;
    const cacheLimit = cacheLimitForDevice();
    const requestController = new AbortController();
    const compressedFrames = new Map<number, Blob>();
    const fetching = new Map<number, Promise<Blob>>();
    const images = new Map<number, DecodedFrame>();
    const pending = new Map<number, Promise<DecodedFrame>>();

    const trimCache = (focus: number) => {
      if (images.size <= cacheLimit) return;
      [...images.keys()]
        .sort((left, right) => Math.abs(right - focus) - Math.abs(left - focus))
        .slice(0, images.size - cacheLimit)
        .forEach((index) => {
          images.get(index)?.release?.();
          images.delete(index);
        });
    };

    const loadCompressedFrame = (index: number) => {
      const bounded = Math.min(Math.max(index, 0), LAST_FRAME);
      const cached = compressedFrames.get(bounded);
      if (cached) return Promise.resolve(cached);
      const existing = fetching.get(bounded);
      if (existing) return existing;
      const request = (async () => {
        const response = await fetch(frameSource(bounded), {
          cache: "force-cache",
          signal: requestController.signal,
        });
        if (!response.ok) {
          throw new Error(`Unable to load Aureum sequence frame ${bounded}.`);
        }
        const blob = await response.blob();
        if (alive) compressedFrames.set(bounded, blob);
        return blob;
      })().finally(() => fetching.delete(bounded));
      fetching.set(bounded, request);
      return request;
    };

    const loadFrame = (index: number) => {
      const bounded = Math.min(Math.max(index, 0), LAST_FRAME);
      const cached = images.get(bounded);
      if (cached) return Promise.resolve(cached);
      const existing = pending.get(bounded);
      if (existing) return existing;
      const request = (async () => {
        const blob = await loadCompressedFrame(bounded);
        let frame: DecodedFrame;
        if (typeof window.createImageBitmap === "function") {
          const bitmap = await window.createImageBitmap(blob);
          frame = {
            source: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            release: () => bitmap.close(),
          };
        } else {
          const objectUrl = URL.createObjectURL(blob);
          try {
            const image = new window.Image();
            image.decoding = "async";
            image.src = objectUrl;
            await image.decode();
            frame = {
              source: image,
              width: image.naturalWidth,
              height: image.naturalHeight,
            };
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        }

        if (!alive) {
          frame.release?.();
          throw new Error("Aureum sequence was disposed before decoding completed.");
        }
        images.set(bounded, frame);
        trimCache(desiredFrame);
        return frame;
      })().finally(() => pending.delete(bounded));
      pending.set(bounded, request);
      return request;
    };

    const prefetchOrder = () => {
      const order: number[] = [];
      const seen = new Set<number>();
      const add = (index: number) => {
        if (index >= 0 && index <= LAST_FRAME && !seen.has(index)) {
          seen.add(index);
          order.push(index);
        }
      };
      add(0);
      for (let index = 10; index <= LAST_FRAME; index += 10) add(index);
      add(LAST_FRAME);
      for (let index = 0; index <= LAST_FRAME; index += 1) add(index);
      return order;
    };

    const startCompressedPrefetch = () => {
      if (prefetchStarted) return;
      prefetchStarted = true;
      const queue = prefetchOrder();
      const worker = async () => {
        while (alive && queue.length) {
          const index = queue.shift();
          if (index !== undefined) await loadCompressedFrame(index).catch(() => undefined);
        }
      };
      void Promise.all(Array.from({ length: 6 }, worker));
    };

    const draw = (image: DecodedFrame, index: number) => {
      const width = canvasNode.width;
      const height = canvasNode.height;
      if (!width || !height) return;
      const scale = Math.max(width / image.width, height / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      context.drawImage(image.source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      renderedFrame = index;
      if (alive && !didRevealCanvas) {
        didRevealCanvas = true;
        setCanvasReady(true);
      }
    };

    const waitForDecodeSlot = () => new Promise<void>((resolve) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => resolve(), { timeout: 120 });
      } else {
        setTimeout(resolve, 16);
      }
    });

    const warmDecodedWindow = (focus: number) => {
      if (Math.abs(focus - warmFocus) < 4) return;
      warmFocus = focus;
      const generation = ++warmGeneration;
      const offsets: number[] = [];
      for (let distance = 1; offsets.length < cacheLimit - 1; distance += 1) {
        const forward = direction > 0 ? focus + distance : focus - distance;
        const backward = direction > 0 ? focus - distance : focus + distance;
        if (forward >= 0 && forward <= LAST_FRAME) offsets.push(forward);
        if (offsets.length < cacheLimit - 1 && backward >= 0 && backward <= LAST_FRAME) offsets.push(backward);
        if (forward < 0 && backward < 0) break;
        if (forward > LAST_FRAME && backward > LAST_FRAME) break;
      }
      void (async () => {
        for (let position = 0; position < offsets.length; position += 1) {
          if (!alive || generation !== warmGeneration) break;
          if (position >= 6) await waitForDecodeSlot();
          if (!alive || generation !== warmGeneration) break;
          await loadFrame(offsets[position]).catch(() => undefined);
          trimCache(desiredFrame);
        }
      })();
    };

    const closestDecodedFrame = (focus: number) => {
      let closestIndex = -1;
      let closestDistance = Number.POSITIVE_INFINITY;
      images.forEach((_, index) => {
        const distance = Math.abs(index - focus);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      });
      return closestIndex;
    };

    const requestDraw = (index: number) => {
      const cached = images.get(index);
      if (cached) {
        if (renderedFrame !== index) draw(cached, index);
      } else {
        const closest = closestDecodedFrame(index);
        const fallback = images.get(closest);
        if (fallback && renderedFrame !== closest) draw(fallback, closest);
        void loadFrame(index).then((frame) => {
          if (alive && Math.abs(index - Math.round(easedFrame)) <= 1) draw(frame, index);
        }).catch(() => undefined);
      }
      warmDecodedWindow(index);
    };

    const renderEasedFrame = () => {
      animationFrame = 0;
      if (!alive) return;
      const distance = targetFrame - easedFrame;
      easedFrame = Math.abs(distance) < 0.08 ? targetFrame : easedFrame + distance * 0.24;
      const nextFrame = Math.round(easedFrame);
      if (nextFrame !== desiredFrame || renderedFrame < 0) {
        direction = nextFrame >= desiredFrame ? 1 : -1;
        desiredFrame = nextFrame;
        requestDraw(nextFrame);
      }
      if (Math.abs(targetFrame - easedFrame) >= 0.08) {
        animationFrame = window.requestAnimationFrame(renderEasedFrame);
      }
    };

    const scheduleRender = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(renderEasedFrame);
    };

    const resizeCanvas = () => {
      const bounds = visualNode.getBoundingClientRect();
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        1.25,
        FRAME_WIDTH / Math.max(bounds.width, 1),
        FRAME_HEIGHT / Math.max(bounds.height, 1),
      );
      canvasNode.width = Math.max(1, Math.round(bounds.width * ratio));
      canvasNode.height = Math.max(1, Math.round(bounds.height * ratio));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "medium";
      const current = images.get(renderedFrame);
      if (current) draw(current, renderedFrame);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(visualNode);
    resizeCanvas();

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      desiredFrame = LAST_FRAME;
      const reducedStageTimer = window.setTimeout(() => {
        if (alive) setActiveStage(2);
      }, 0);
      progressBar.current?.style.setProperty("--sequence-progress", "100%");
      void loadFrame(LAST_FRAME).then((image) => draw(image, LAST_FRAME)).catch(() => undefined);
      return () => {
        alive = false;
        requestController.abort();
        window.clearTimeout(reducedStageTimer);
        resizeObserver.disconnect();
        window.cancelAnimationFrame(animationFrame);
        images.forEach((image) => image.release?.());
        images.clear();
        pending.clear();
        compressedFrames.clear();
        fetching.clear();
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        startCompressedPrefetch();
        void loadFrame(0).then((image) => {
          if (alive && renderedFrame < 0) {
            draw(image, 0);
            warmDecodedWindow(0);
          }
        }).catch(() => undefined);
        observer.disconnect();
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(section);

    const gsapContext = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const nextTarget = self.progress * LAST_FRAME;
          direction = nextTarget >= targetFrame ? 1 : -1;
          targetFrame = nextTarget;
          scheduleRender();
          const nextStage = stageForProgress(self.progress);
          if (nextStage !== currentStage) {
            currentStage = nextStage;
            setActiveStage(nextStage);
          }
          progressBar.current?.style.setProperty("--sequence-progress", `${self.progress * 100}%`);
        },
      });
    }, section);

    return () => {
      alive = false;
      requestController.abort();
      observer.disconnect();
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
      gsapContext.revert();
      images.forEach((image) => image.release?.());
      images.clear();
      pending.clear();
      compressedFrames.clear();
      fetching.clear();
    };
  }, []);

  return (
    <section ref={root} id="system" className="aureum-sequence-story" aria-label="The Aureum System development journey">
      <div className="aureum-sequence-sticky">
        <div ref={visual} className={`aureum-sequence-visual${canvasReady ? " is-ready" : ""}`} aria-hidden="true">
          <Image className="aureum-sequence-poster" src={POSTER} alt="" fill sizes="(max-width: 900px) 100vw, 62vw" unoptimized />
          <canvas ref={canvas} />
          <div className="aureum-sequence-shade" />
          <span className="aureum-sequence-visual-label">Opportunity → Asset</span>
        </div>
        <div className="aureum-sequence-copy">
          <Eyebrow>From Opportunity to Asset</Eyebrow>
          <div className="aureum-sequence-stage-stack" aria-live="polite">
            {pillars.map((pillar, index) => (
              <article className={activeStage === index ? "is-active" : ""} aria-hidden={activeStage !== index} key={pillar.n}>
                <h2>{pillar.title}</h2>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
          <div className="aureum-sequence-progress" aria-hidden="true">
            <span ref={progressBar} />
            <div><b>0{activeStage + 1}</b><small>{stageNotes[activeStage]}</small></div>
          </div>
        </div>
      </div>
    </section>
  );
}
