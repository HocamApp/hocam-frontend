"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export interface CircularGalleryItem {
  /** Name on the card. */
  title: string;
  /** One quiet line under it. */
  subtitle?: string;
  image: string;
  /** What the picture shows, for a reader who cannot see it. */
  alt: string;
  /** object-position, for images whose subject is off-centre. */
  objectPosition?: string;
}

interface CircularGalleryProps {
  items: CircularGalleryItem[];
  /** How far the cards sit from the centre, in pixels. */
  radius?: number;
  /** Degrees per second. */
  speed?: number;
  className?: string;
}

/**
 * A carousel of cards standing on a circle, turning by itself.
 *
 * Two departures from the component this is adapted from, both deliberate:
 *
 * **It does not read the scroll position.** The original mapped page scroll to
 * rotation, which makes the carousel a scroll indicator — it stops when the
 * reader stops, and on a page whose scroll is already doing three other jobs
 * it reads as jitter. This turns at a constant rate and ignores the page.
 *
 * **It does not re-render.** The original held the angle in React state and
 * set it every animation frame, which is sixty renders a second for a number
 * no other component reads. The angle lives in a ref and is written straight
 * to the DOM, so React runs once.
 *
 * The motion is decorative, which DESIGN.md §5 does not otherwise permit, so
 * it carries the exemptions that rule exists to protect: it stops dead under
 * `prefers-reduced-motion`, and it stops while the tab is hidden or the
 * carousel is scrolled out of view rather than burning frames unseen.
 */
export function CircularGallery({
  items,
  radius = 430,
  speed = 6,
  className,
}: CircularGalleryProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    const anglePerItem = 360 / items.length;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let rotation = 0;
    let last = 0;
    let frame: number | null = null;
    let onScreen = true;

    /* Cards on the far side of the circle are drawn back rather than left at
       full strength, which is the whole depth cue — without it the ring reads
       as a flat row of overlapping rectangles. */
    const paint = () => {
      ring.style.transform = `rotateY(${rotation}deg)`;
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const angle = (index * anglePerItem + rotation) % 360;
        const fromFront = Math.abs(angle > 180 ? 360 - angle : angle);
        card.style.opacity = String(Math.max(0.25, 1 - fromFront / 165));
      });
    };

    const step = (now: number) => {
      const elapsed = last === 0 ? 0 : (now - last) / 1000;
      last = now;
      // Clamped: a backgrounded tab can hand back a gap of seconds, which
      // would otherwise spin the ring several turns in a single frame.
      rotation = (rotation + speed * Math.min(elapsed, 0.1)) % 360;
      paint();
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (frame !== null || reduced.matches || !onScreen) return;
      last = 0;
      frame = requestAnimationFrame(step);
    };

    const stop = () => {
      if (frame === null) return;
      cancelAnimationFrame(frame);
      frame = null;
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    const onPreference = () => {
      if (reduced.matches) stop();
      else start();
      paint();
    };

    // Off-screen it is not being looked at, so it does not need to move.
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(ring);

    paint();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onPreference);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onPreference);
    };
  }, [items.length, speed]);

  const anglePerItem = 360 / items.length;

  return (
    <div
      role="group"
      aria-label="Hocalarımızın okuduğu üniversiteler"
      className={cn(
        "relative flex h-full w-full items-center justify-center",
        className,
      )}
      style={{ perspective: "1900px" }}
    >
      <div
        ref={ringRef}
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {items.map((item, index) => (
          <figure
            key={item.image}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            className="absolute left-1/2 top-1/2 h-[196px] w-[292px] overflow-hidden rounded-card border border-line bg-surface shadow-float sm:h-[236px] sm:w-[352px]"
            style={{
              transform: `translate(-50%, -50%) rotateY(${index * anglePerItem}deg) translateZ(${radius}px)`,
            }}
          >
            {/* Plain img, not next/image: the card is transformed in 3D and
                sized in CSS, so the layout box next/image optimises for is not
                the box these are drawn in. They are pre-sized on disk. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: item.objectPosition ?? "center" }}
            />

            {/* The name sits on the picture rather than on a bar under it.
                That needs something between white text and a pale sky, and the
                two honest options are a scrim or a solid bar; the bar cuts the
                illustration in half, so the scrim wins. It is the one gradient
                in the system, ink-tinted rather than black, and it fades to
                nothing well before the middle of the card.

                The shadow on the glyphs is what carries the light patches —
                these campuses have bright pavements and grass at the bottom
                edge, where the scrim alone leaves white on near-white. */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[58%]"
              style={{
                background:
                  "linear-gradient(to top, rgb(2 23 26 / 88%) 0%, rgb(2 23 26 / 62%) 38%, rgb(2 23 26 / 0%) 100%)",
              }}
            />
            <figcaption
              className="absolute inset-x-0 bottom-0 px-5 pb-4 text-white"
              style={{ textShadow: "0 1px 3px rgb(2 23 26 / 55%)" }}
            >
              <p className="text-body font-semibold leading-snug">{item.title}</p>
              {item.subtitle && (
                <p className="mt-0.5 text-small text-white/85">{item.subtitle}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
