"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./WisprReferencePage.module.css";

export function SquigglyWord({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(styles.squigglyWord, className)}>
      <span className={styles.squigglyText}>{children}</span>
      <svg
        className={styles.squigglyMark}
        viewBox="0 0 220 24"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="none"
      >
        <path d="M4 14 C 22 3, 38 24, 56 13 S 91 3, 110 14 S 145 25, 164 13 S 199 4, 216 14" />
      </svg>
    </span>
  );
}
