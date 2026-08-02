"use client";

import { useEffect } from "react";
import { recordDiscoveryExposures } from "@/lib/discovery";

export function useDiscoveryExposures(impressionId?: string | null) {
  useEffect(() => {
    if (!impressionId) return;
    const seen = new Set<string>();
    const timers = new Map<Element, ReturnType<typeof setTimeout>>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const tutorId = (entry.target as HTMLElement).dataset.discoveryTutorId;
        if (!tutorId || seen.has(tutorId)) continue;
        const pending = timers.get(entry.target);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!pending) {
            timers.set(entry.target, setTimeout(() => {
              seen.add(tutorId);
              observer.unobserve(entry.target);
              timers.delete(entry.target);
              void recordDiscoveryExposures(impressionId, [tutorId]);
            }, 500));
          }
        } else if (pending) {
          clearTimeout(pending);
          timers.delete(entry.target);
        }
      }
    }, { threshold: [0.5] });
    const elements = document.querySelectorAll<HTMLElement>(`[data-discovery-impression-id="${impressionId}"]`);
    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [impressionId]);
}
