"use client";

import {
  ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { EASE_OUT } from "@/components/ui/ease";
import { cn } from "@/lib/utils";

// Transition constants copied verbatim from the Componentry source of truth at
// src/components/ui/bouncy-accordion.tsx — do not retune.
const ROW_TRANSITION: Transition = {
  type: "spring",
  duration: 0.55,
  bounce: 0.38,
};

const CONTENT_OPEN_TRANSITION: Transition = {
  type: "spring",
  duration: 0.58,
  bounce: 0.32,
};

const CONTENT_CLOSE_TRANSITION: Transition = {
  type: "spring",
  duration: 0.46,
  bounce: 0.26,
};

const DESCRIPTION_TRANSITION: Transition = {
  duration: 0.18,
  ease: EASE_OUT,
};

const CHEVRON_TRANSITION: Transition = {
  type: "spring",
  duration: 0.42,
  bounce: 0.28,
};

interface ProfileAccordionSectionProps {
  icon: ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  startsGroup: boolean;
  endsGroup: boolean;
  separatedFromPrevious: boolean;
  children: ReactNode;
}

/**
 * A single collapsible section inside the profile menu. Controlled by ProfileMenu
 * (single-open) and animated with the Componentry "Bouncy Accordion" mechanics:
 * measured-height spring, chevron spring, opacity fade, and connected-group
 * marginTop / corner-radius springs driven by neighbour open-state.
 */
export function ProfileAccordionSection({
  icon,
  title,
  open,
  onToggle,
  startsGroup,
  endsGroup,
  separatedFromPrevious,
  children,
}: ProfileAccordionSectionProps) {
  const reduce = useReducedMotion();
  const baseId = useId();
  const contentId = `${baseId}-content`;
  const triggerId = `${baseId}-trigger`;

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const updateHeight = () => {
      setContentHeight(node.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ marginTop: separatedFromPrevious ? 12 : 0 }}
      transition={reduce ? { duration: 0 } : ROW_TRANSITION}
    >
      <motion.div
        data-state={open ? "open" : "closed"}
        initial={false}
        animate={{
          borderTopLeftRadius: startsGroup ? 18 : 0,
          borderTopRightRadius: startsGroup ? 18 : 0,
          borderBottomLeftRadius: endsGroup ? 18 : 0,
          borderBottomRightRadius: endsGroup ? 18 : 0,
        }}
        transition={reduce ? { duration: 0 } : ROW_TRANSITION}
        className="overflow-hidden border border-border bg-background text-foreground shadow-sm"
      >
        <button
          id={triggerId}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/70">
            {icon}
          </span>
          <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
          <motion.span
            aria-hidden
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : CHEVRON_TRANSITION}
            className="grid h-4 w-4 shrink-0 place-items-center text-muted-foreground"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        <motion.div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          aria-hidden={!open}
          initial={false}
          animate={{ height: open ? contentHeight : 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : open
                ? CONTENT_OPEN_TRANSITION
                : CONTENT_CLOSE_TRANSITION
          }
          className="overflow-hidden"
        >
          <motion.div
            ref={contentRef}
            animate={{ opacity: open ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : DESCRIPTION_TRANSITION}
            className="space-y-3 px-4 pb-4 pt-0.5"
          >
            {children}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
