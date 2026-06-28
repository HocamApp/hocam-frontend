"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

type ViewTransition = {
  ready: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

type AnimatedThemeTogglerProps = {
  className?: string;
  onThemeChange?: (theme: Theme) => void;
};

export const AnimatedThemeToggler = ({
  className,
  onThemeChange,
}: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    const syncTheme = () =>
      setDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const onToggle = useCallback(async () => {
    if (!buttonRef.current) return;

    const toggleTheme = () => {
      const toggled = !darkMode;
      const nextTheme: Theme = toggled ? "dark" : "light";
      setDarkMode(toggled);
      document.documentElement.classList.toggle("dark", toggled);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        /* ignore storage errors */
      }
      onThemeChange?.(nextTheme);
    };

    const startViewTransition = (document as DocumentWithViewTransition)
      .startViewTransition;

    if (!startViewTransition) {
      flushSync(toggleTheme);
      return;
    }

    await startViewTransition.call(document, () => {
      flushSync(toggleTheme);
    }).ready;

    if (!buttonRef.current) return;

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const maxDistance = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${centerX}px ${centerY}px)`,
          `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [darkMode, onThemeChange]);

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      aria-label={darkMode ? "Açık temaya geç" : "Koyu temaya geç"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 p-2 text-slate-800 shadow-sm ring-1 ring-slate-200/80 outline-none transition-colors hover:bg-slate-200 focus:outline-none active:outline-none focus:ring-0 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/80 dark:hover:bg-slate-700 cursor-pointer",
        className
      )}
      type="button"
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.span
            key="sun-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: 25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-amber-200"
          >
            <Sun />
          </motion.span>
        ) : (
          <motion.span
            key="moon-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-slate-700"
          >
            <Moon />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};
