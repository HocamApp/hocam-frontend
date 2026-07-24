"use client";

import { useEffect } from "react";
import { clearLegacyAutomaticTranslation } from "@/lib/interfaceLanguage";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    clearLegacyAutomaticTranslation();
  }, []);

  return children;
}
