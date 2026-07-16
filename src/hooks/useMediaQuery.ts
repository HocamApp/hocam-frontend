"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean | undefined {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean | undefined {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}
