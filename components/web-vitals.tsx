"use client";

import { useReportWebVitals } from "next/web-vitals";

type MetricPayload = {
  id: string;
  name: string;
  value: number;
  rating: string;
  delta: number;
  navigationType: string;
  path: string;
};

export function WebVitals() {
  useReportWebVitals((metric) => {
    const endpoint = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;
    if (!endpoint || navigator.doNotTrack === "1") return;
    const payload: MetricPayload = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
      path: location.pathname,
    };
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(endpoint, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    });
  });
  return null;
}
