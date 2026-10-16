"use client";

import { useEffect } from "react";

import { MobileTabBar } from "@/components/layout/MobileTabBar";

import { YsNavbar } from "./YsNavbar";

type Surface = "top" | "bottom";

/** Renders the real app navigation inside the same-origin /araclar shell. */
export function ToolsNavbarBridge({ surface }: { surface: Surface }) {
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";

    let frame = 0;
    const report = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const header = document.querySelector<HTMLElement>("[data-app-header]");
        const mobile = document.querySelector<HTMLElement>('nav[aria-label="Mobil ana menü"]');
        const visible = surface === "top" || Boolean(mobile);
        const base = surface === "top" ? Math.ceil(header?.getBoundingClientRect().bottom ?? 56) : 64;
        let height = base;
        const openLayers = document.querySelectorAll<HTMLElement>(
          '[data-radix-popper-content-wrapper], [role="dialog"][data-state="open"], [role="menu"][data-state="open"]',
        );
        if (openLayers.length > 0) {
          // The frame's own innerHeight is only the header height. Popovers
          // need the containing page's viewport so they can expand in full.
          try {
            height = window.parent.innerHeight;
          } catch {
            height = window.innerHeight;
          }
        }
        window.parent.postMessage({ type: "hocam-tools-navbar-size", surface, height, visible }, "*");
      });
    };

    const navigateInParent = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      event.preventDefault();
      event.stopPropagation();
      const destination = link.getAttribute("href") === "#ys-main-content" ? "#icerik" : link.href;
      window.top?.location.assign(destination);
    };

    const observer = new MutationObserver(report);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state", "class"] });
    const resizeObserver = new ResizeObserver(report);
    const header = document.querySelector<HTMLElement>("[data-app-header]");
    if (header) resizeObserver.observe(header);
    document.addEventListener("click", navigateInParent, true);
    window.addEventListener("resize", report);
    report();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("click", navigateInParent, true);
      window.removeEventListener("resize", report);
    };
  }, [surface]);

  return surface === "top" ? <YsNavbar startCoachmark={false} /> : <MobileTabBar />;
}
