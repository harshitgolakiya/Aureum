"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const traits = [
  { name: "Leadership", value: 92, suffix: "%", radius: 210, span: 210, color: "var(--traits-navy)" },
  { name: "Expertise", value: 95, suffix: "%", radius: 170, span: 255, color: "var(--traits-blue)" },
  { name: "Intelligence", value: 98, suffix: "%", radius: 130, span: 300, color: "var(--traits-gold)" },
] as const;

const centerX = 270;
const centerY = 270;
const labelX = 520;

function pointOnRing(radius: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  return {
    x: centerX - radius * Math.sin(angle),
    y: centerY - radius * Math.cos(angle),
  };
}

export function PartnerSystemGraphic() {
  const root = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState(() => traits.map(() => 0));

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      element.classList.add("is-active");
      const timer = window.setTimeout(
        () => setValues(traits.map((trait) => trait.value)),
        0,
      );
      return () => clearTimeout(timer);
    }

    const timers: number[] = [];
    const frames: number[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.classList.add("is-active");

        traits.forEach((trait, index) => {
          const timer = window.setTimeout(() => {
            const startedAt = performance.now();
            const tick = (now: number) => {
              const progress = Math.min((now - startedAt) / 1100, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValues((current) => {
                const next = [...current];
                next[index] = Math.round(trait.value * eased);
                return next;
              });
              if (progress < 1) frames.push(requestAnimationFrame(tick));
            };
            frames.push(requestAnimationFrame(tick));
          }, (index * 0.22 + 1.8) * 1000);
          timers.push(timer);
        });

        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
    };
  }, []);

  return (
    <div ref={root} className="partner-system-graphic aureum-traits">
      <svg
        viewBox="0 0 720 540"
        role="img"
        aria-label="Aureum core traits: leadership at 92 percent, expertise at 95 percent and intelligence at 98 percent"
      >
        <title>Aureum core traits</title>
        <desc>
          Leadership at 92 percent, expertise at 95 percent and intelligence at
          98 percent.
        </desc>

        {traits.map((trait, index) => {
          const endpoint = pointOnRing(trait.radius, trait.span);
          const animatedStyle = {
            "--trait-delay": `${(index * 0.22).toFixed(2)}s`,
          } as CSSProperties;

          return (
            <g key={trait.name}>
              <circle
                className="aureum-traits-track"
                cx={centerX}
                cy={centerY}
                r={trait.radius}
                strokeWidth="26"
              />
              <path
                className="aureum-traits-leader"
                pathLength="100"
                d={`M${endpoint.x},${endpoint.y} H${labelX - 14}`}
                stroke={trait.color}
                style={animatedStyle}
              />
              <path
                className="aureum-traits-arc"
                pathLength="100"
                strokeWidth="26"
                d={`M${centerX},${centerY - trait.radius} A${trait.radius},${trait.radius} 0 ${trait.span > 180 ? 1 : 0} 0 ${endpoint.x},${endpoint.y}`}
                stroke={trait.color}
                style={animatedStyle}
              />
              <circle
                className="aureum-traits-dot"
                cx={labelX - 14}
                cy={endpoint.y}
                r="5"
                fill={trait.color}
                style={animatedStyle}
              />
              <g className="aureum-traits-label" style={animatedStyle}>
                <text
                  className="aureum-traits-value"
                  x={labelX}
                  y={endpoint.y + 4}
                  fill={trait.color}
                >
                  {values[index]}
                  {trait.suffix}
                </text>
                <text
                  className="aureum-traits-name"
                  x={labelX + 2}
                  y={endpoint.y + 26}
                >
                  {trait.name}
                </text>
              </g>
            </g>
          );
        })}

        <g className="aureum-traits-center">
          <text
            className="aureum-traits-brand"
            x={centerX + 4}
            y={centerY + 6}
            textAnchor="middle"
          >
            AUREUM
          </text>
          <text
            className="aureum-traits-subtitle"
            x={centerX + 2}
            y={centerY + 28}
            textAnchor="middle"
          >
            CORE TRAITS
          </text>
        </g>
      </svg>
    </div>
  );
}
