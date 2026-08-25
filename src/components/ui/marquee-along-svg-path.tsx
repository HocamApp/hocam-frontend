"use client";

import * as React from "react";
import { type RefObject, useCallback, useEffect, useId, useMemo, useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
  type SpringOptions,
} from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Marquee that travels along an SVG path (21st.dev).
 *
 * Two deliberate changes from the published source:
 *
 * 1. **Imports `framer-motion`, not `motion/react`.** Both are installed at
 *    v12 and export the same API, but 30 files here already use
 *    `framer-motion` — importing the other name ships a second copy of the
 *    same library.
 *
 * 2. **Per-item hooks moved into `PathItem`.** Upstream calls `useTransform`,
 *    `useMotionValue` and `useEffect` inside `items.map()`. That is a rules-of-
 *    hooks violation: change the child count or `repeat` and the hook order
 *    shifts, which React resolves by handing a component another component's
 *    state. It also fails `react-hooks/rules-of-hooks`, so lint would not pass.
 *    Rendering each item as its own component makes the same hooks legal.
 *
 * One upstream caveat survives: `cssVariableInterpolation` is mapped over with
 * `useTransform`, so its **length must stay constant** across renders. Treat it
 * as a mount-time config, not state.
 *
 * Positioning relies on CSS `offset-path`, which needs Chrome/Edge 55+,
 * Safari 16+ or Firefox 72+. Older browsers stack every item at the path
 * origin rather than breaking the page.
 */

const wrap = (min: number, max: number, value: number): number => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

type PreserveAspectRatioAlign =
  | "none"
  | "xMinYMin"
  | "xMidYMin"
  | "xMaxYMin"
  | "xMinYMid"
  | "xMidYMid"
  | "xMaxYMid"
  | "xMinYMax"
  | "xMidYMax"
  | "xMaxYMax";

interface CSSVariableInterpolation {
  property: string;
  from: number | string;
  to: number | string;
}

type PreserveAspectRatioMeetOrSlice = "meet" | "slice";

type PreserveAspectRatio =
  | PreserveAspectRatioAlign
  | `${Exclude<PreserveAspectRatioAlign, "none">} ${PreserveAspectRatioMeetOrSlice}`;

interface MarqueeAlongSvgPathProps {
  children: React.ReactNode;
  className?: string;

  path: string;
  pathId?: string;
  preserveAspectRatio?: PreserveAspectRatio;
  showPath?: boolean;

  width?: string | number;
  height?: string | number;
  viewBox?: string;

  baseVelocity?: number;
  direction?: "normal" | "reverse";
  easing?: (value: number) => number;
  slowdownOnHover?: boolean;
  slowDownFactor?: number;
  slowDownSpringConfig?: SpringOptions;

  useScrollVelocity?: boolean;
  scrollAwareDirection?: boolean;
  scrollSpringConfig?: SpringOptions;
  scrollContainer?: RefObject<HTMLElement | null> | HTMLElement | null;

  repeat?: number;

  draggable?: boolean;
  dragSensitivity?: number;
  dragVelocityDecay?: number;
  dragAwareDirection?: boolean;
  grabCursor?: boolean;

  /**
   * Rotate each item to the path's tangent. On by default, matching the
   * reference. Turn it off for anything containing text — upright type stays
   * readable, tangent-aligned type ends up upside down on the return curve.
   */
  rotateAlongPath?: boolean;

  enableRollingZIndex?: boolean;
  zIndexBase?: number;
  zIndexRange?: number;

  cssVariableInterpolation?: CSSVariableInterpolation[];

  responsive?: boolean;
}

interface PathItemProps {
  child: React.ReactNode;
  itemIndex: number;
  itemCount: number;
  repeatIndex: number;
  baseOffset: MotionValue<number>;
  path: string;
  easing?: (value: number) => number;
  enableRollingZIndex: boolean;
  calculateZIndex: (offsetDistance: number) => number | undefined;
  cssVariableInterpolation: CSSVariableInterpolation[];
  rotateAlongPath: boolean;
  draggable: boolean;
  grabCursor: boolean;
  onHoverChange: (hovered: boolean) => void;
}

function PathItem({
  child,
  itemIndex,
  itemCount,
  repeatIndex,
  baseOffset,
  path,
  easing,
  enableRollingZIndex,
  calculateZIndex,
  cssVariableInterpolation,
  rotateAlongPath,
  draggable,
  grabCursor,
  onHoverChange,
}: PathItemProps) {
  // Items are spread evenly around the path, then each one is carried forward
  // by the shared offset and wrapped — so the loop has no seam to hide.
  const itemOffset = useTransform(baseOffset, (v) => {
    const position = (itemIndex * 100) / itemCount;
    const wrappedValue = wrap(0, 100, v + position);
    return `${easing ? easing(wrappedValue / 100) * 100 : wrappedValue}%`;
  });

  const currentOffsetDistance = useMotionValue(0);
  const zIndex = useTransform(currentOffsetDistance, (value) => calculateZIndex(value));

  useEffect(() => {
    const unsubscribe = itemOffset.on("change", (value: string) => {
      const match = value.match(/^([\d.]+)%$/);
      if (match && match[1]) {
        currentOffsetDistance.set(parseFloat(match[1]));
      }
    });
    return unsubscribe;
  }, [itemOffset, currentOffsetDistance]);

  const cssVariables = Object.fromEntries(
    cssVariableInterpolation.map(({ property, from, to }) => [
      property,
      // eslint-disable-next-line react-hooks/rules-of-hooks -- length is fixed config, see file header
      useTransform(currentOffsetDistance, [0, 100], [from, to]),
    ]),
  );

  return (
    <motion.div
      className={cn("absolute left-0 top-0", draggable && grabCursor && "cursor-grab")}
      style={{
        offsetPath: `path('${path}')`,
        offsetDistance: itemOffset,
        offsetRotate: rotateAlongPath ? "auto" : "0deg",
        zIndex: enableRollingZIndex ? zIndex : undefined,
        willChange: "offset-distance",
        backfaceVisibility: "hidden",
        ...cssVariables,
      }}
      aria-hidden={repeatIndex > 0}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {child}
    </motion.div>
  );
}

export default function MarqueeAlongSvgPath({
  children,
  className,

  path,
  pathId,
  preserveAspectRatio = "xMidYMid meet",
  showPath = false,

  width = "100%",
  height = "100%",
  viewBox = "0 0 100 100",

  baseVelocity = 5,
  direction = "normal",
  easing,
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  slowDownSpringConfig = { damping: 50, stiffness: 400 },

  useScrollVelocity = false,
  scrollAwareDirection = false,
  scrollSpringConfig = { damping: 50, stiffness: 400 },
  scrollContainer,

  repeat = 3,

  draggable = false,
  dragSensitivity = 0.2,
  dragVelocityDecay = 0.96,
  dragAwareDirection = false,
  grabCursor = false,

  rotateAlongPath = true,

  enableRollingZIndex = true,
  zIndexBase = 1,
  zIndexRange = 10,

  cssVariableInterpolation = [],

  responsive = false,
}: MarqueeAlongSvgPathProps) {
  const container = useRef<HTMLDivElement>(null);
  const marqueeContainerRef = useRef<HTMLDivElement>(null);
  const baseOffset = useMotionValue(0);

  // Scales the fixed-size path box to fill its wrapper. Done by writing styles
  // directly rather than through state, so a resize never re-renders the items.
  useEffect(() => {
    if (!responsive) return;

    const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number);
    const originalWidth = vbWidth || 100;
    const originalHeight = vbHeight || 100;

    const updateScale = () => {
      const wrapper = container.current;
      const marqueeContainer = marqueeContainerRef.current;
      if (!wrapper || !marqueeContainer) return;

      const wrapperWidth = wrapper.clientWidth;
      const wrapperHeight = wrapper.clientHeight;

      const scale = Math.min(wrapperWidth / originalWidth, wrapperHeight / originalHeight);
      const offsetX = (wrapperWidth - originalWidth * scale) / 2;
      const offsetY = (wrapperHeight - originalHeight * scale) / 2;

      marqueeContainer.style.width = `${originalWidth}px`;
      marqueeContainer.style.height = `${originalHeight}px`;
      marqueeContainer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      marqueeContainer.style.transformOrigin = "top left";
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [responsive, viewBox]);

  const items = useMemo(() => {
    const childrenArray = React.Children.toArray(children);

    return childrenArray.flatMap((child, childIndex) =>
      Array.from({ length: repeat }, (_, repeatIndex) => ({
        child,
        repeatIndex,
        itemIndex: repeatIndex * childrenArray.length + childIndex,
        key: `${childIndex}-${repeatIndex}`,
      })),
    );
  }, [children, repeat]);

  const calculateZIndex = useCallback(
    (offsetDistance: number) => {
      if (!enableRollingZIndex) return undefined;
      return Math.floor(zIndexBase + (offsetDistance / 100) * zIndexRange);
    },
    [enableRollingZIndex, zIndexBase, zIndexRange],
  );

  // Upstream generates this with Math.random(), which gives the server and the
  // client different ids and trips a hydration mismatch on every mount.
  // useId() is stable across both.
  const reactId = useId();
  const id = pathId || `marquee-path-${reactId.replace(/:/g, "")}`;

  // Only bind to a container when the scroll feature is on; pointing `useScroll`
  // at a non-scrolling element makes framer-motion warn on every mount.
  const { scrollY } = useScroll({
    container: useScrollVelocity
      ? ((scrollContainer as RefObject<HTMLDivElement | null>) ?? container)
      : undefined,
  });

  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, scrollSpringConfig);

  const isHovered = useRef(false);
  const isDragging = useRef(false);
  const dragVelocity = useRef(0);
  const directionFactor = useRef(direction === "normal" ? 1 : -1);

  const hoverFactorValue = useMotionValue(1);
  const defaultVelocity = useMotionValue(1);
  const smoothHoverFactor = useSpring(hoverFactorValue, slowDownSpringConfig);

  const velocityFactor = useTransform(
    useScrollVelocity ? smoothVelocity : defaultVelocity,
    [0, 1000],
    [0, 5],
    { clamp: false },
  );

  const handleHoverChange = useCallback((hovered: boolean) => {
    isHovered.current = hovered;
  }, []);

  useAnimationFrame((_, delta) => {
    if (isDragging.current && draggable) {
      baseOffset.set(baseOffset.get() + dragVelocity.current);
      dragVelocity.current *= 0.9;
      if (Math.abs(dragVelocity.current) < 0.01) dragVelocity.current = 0;
      return;
    }

    hoverFactorValue.set(isHovered.current && slowdownOnHover ? slowDownFactor : 1);

    let moveBy =
      directionFactor.current * baseVelocity * (delta / 1000) * smoothHoverFactor.get();

    if (scrollAwareDirection && !isDragging.current) {
      if (velocityFactor.get() < 0) directionFactor.current = -1;
      else if (velocityFactor.get() > 0) directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    if (draggable) {
      moveBy += dragVelocity.current;

      if (dragAwareDirection && Math.abs(dragVelocity.current) > 0.1) {
        directionFactor.current = Math.sign(dragVelocity.current);
      }

      if (!isDragging.current && Math.abs(dragVelocity.current) > 0.01) {
        dragVelocity.current *= dragVelocityDecay;
      } else if (!isDragging.current) {
        dragVelocity.current = 0;
      }
    }

    baseOffset.set(baseOffset.get() + moveBy);
  });

  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (grabCursor) (e.currentTarget as HTMLElement).style.cursor = "grabbing";

    isDragging.current = true;
    lastPointerPosition.current = { x: e.clientX, y: e.clientY };
    dragVelocity.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggable || !isDragging.current) return;

    const deltaX = e.clientX - lastPointerPosition.current.x;
    const deltaY = e.clientY - lastPointerPosition.current.y;

    // The path can run in any direction, so drag distance is taken as a
    // magnitude and only its horizontal sign decides which way along it.
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    dragVelocity.current = (deltaX > 0 ? delta : -delta) * dragSensitivity;

    lastPointerPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggable) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    isDragging.current = false;
    if (grabCursor) (e.currentTarget as HTMLElement).style.cursor = "grab";
  };

  return (
    <div
      ref={container}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn("relative", className)}
    >
      <div ref={marqueeContainerRef} className="relative" style={{ contain: "layout style" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={height}
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          className="h-full w-full"
        >
          <path id={id} d={path} stroke={showPath ? "currentColor" : "none"} fill="none" />
        </svg>

        {items.map(({ child, repeatIndex, itemIndex, key }) => (
          <PathItem
            key={key}
            child={child}
            itemIndex={itemIndex}
            itemCount={items.length}
            repeatIndex={repeatIndex}
            baseOffset={baseOffset}
            path={path}
            easing={easing}
            enableRollingZIndex={enableRollingZIndex}
            calculateZIndex={calculateZIndex}
            cssVariableInterpolation={cssVariableInterpolation}
            rotateAlongPath={rotateAlongPath}
            draggable={draggable}
            grabCursor={grabCursor}
            onHoverChange={handleHoverChange}
          />
        ))}
      </div>
    </div>
  );
}
