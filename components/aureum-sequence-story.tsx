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
const CACHE_LIMIT = 18;
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
    let renderedFrame = -1;
    let loadingTarget = false;
    let direction = 1;
    let neighborTimer = 0;
    let didRevealCanvas = false;
    let currentStage = 0;
    const requestController = new AbortController();
    const images = new Map<number, DecodedFrame>();
    const pending = new Map<number, Promise<DecodedFrame>>();

    const trimCache = (focus: number) => {
      if (images.size <= CACHE_LIMIT) return;
      [...images.keys()]
        .sort((left, right) => Math.abs(right - focus) - Math.abs(left - focus))
        .slice(0, images.size - CACHE_LIMIT)
        .forEach((index) => {
          images.get(index)?.release?.();
          images.delete(index);
        });
    };

    const loadFrame = (index: number) => {
      const bounded = Math.min(Math.max(index, 0), LAST_FRAME);
      const cached = images.get(bounded);
      if (cached) return Promise.resolve(cached);
      const existing = pending.get(bounded);
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

    const preloadNeighbors = (focus: number) => {
      window.clearTimeout(neighborTimer);
      neighborTimer = window.setTimeout(() => {
        const offsets = direction > 0
          ? [1, 2, 3, -1]
          : [-1, -2, -3, 1];
        void (async () => {
          for (const offset of offsets) {
            if (!alive || focus !== desiredFrame) break;
            const index = focus + offset;
            if (index >= 0 && index <= LAST_FRAME) {
              await loadFrame(index).catch(() => undefined);
            }
          }
          trimCache(focus);
        })();
      }, 80);
    };

    const renderDesiredFrame = async () => {
      if (loadingTarget || !alive) return;
      loadingTarget = true;
      const target = desiredFrame;
      try {
        const image = await loadFrame(target);
        if (alive && target === desiredFrame) draw(image, target);
      } catch {
        // The poster remains visible if an individual frame cannot be decoded.
      } finally {
        loadingTarget = false;
        if (alive && target !== desiredFrame) void renderDesiredFrame();
        else if (alive) preloadNeighbors(target);
      }
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
      void renderDesiredFrame();
      return () => {
        alive = false;
        requestController.abort();
        window.clearTimeout(reducedStageTimer);
        resizeObserver.disconnect();
        window.clearTimeout(neighborTimer);
        images.forEach((image) => image.release?.());
        images.clear();
        pending.clear();
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        void loadFrame(0).then((image) => {
          if (alive && renderedFrame < 0) draw(image, 0);
        }).catch(() => undefined);
        observer.disconnect();
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(section);

    const gsapContext = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const nextFrame = Math.round(self.progress * LAST_FRAME);
          if (nextFrame !== desiredFrame) {
            direction = nextFrame > desiredFrame ? 1 : -1;
            desiredFrame = nextFrame;
            void renderDesiredFrame();
          }
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
      window.clearTimeout(neighborTimer);
      gsapContext.revert();
      images.forEach((image) => image.release?.());
      images.clear();
      pending.clear();
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
