"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getStoredInterfaceLanguage,
  INTERFACE_CONTENT_READY_EVENT,
  type InterfaceLanguage,
} from "@/lib/interfaceLanguage";

type TranslateElementConstructor = new (
  options: {
    pageLanguage: string;
    includedLanguages: string;
    autoDisplay: boolean;
  },
  elementId: string
) => unknown;

declare global {
  interface Window {
    hocamGoogleTranslateInit?: () => void;
  }
}

type TranslatorWindow = Window & {
  google?: {
    translate?: {
      TranslateElement?: TranslateElementConstructor;
    };
  };
};

const ELEMENT_ID = "hocam-google-translate";
const REFRESH_DELAYS = [0, 400, 1200] as const;

function refreshEnglishTranslation() {
  const selector = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!selector) return;

  selector.value = "en";
  selector.dispatchEvent(new Event("change"));
}

function scheduleTranslationRefresh() {
  return REFRESH_DELAYS.map((delay) =>
    window.setTimeout(refreshEnglishTranslation, delay)
  );
}

function initializeTranslator() {
  const TranslateElement = (window as TranslatorWindow).google?.translate
    ?.TranslateElement;
  const container = document.getElementById(ELEMENT_ID);

  if (!TranslateElement || !container || container.childElementCount > 0) return;

  new TranslateElement(
    {
      pageLanguage: "tr",
      includedLanguages: "tr,en",
      autoDisplay: false,
    },
    ELEMENT_ID
  );

  scheduleTranslationRefresh();
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<InterfaceLanguage>("tr");

  useEffect(() => {
    const storedLanguage = getStoredInterfaceLanguage();
    document.documentElement.lang = storedLanguage;
    setLanguage(storedLanguage);
    window.hocamGoogleTranslateInit = initializeTranslator;

    if (storedLanguage === "en") initializeTranslator();

    return () => {
      delete window.hocamGoogleTranslateInit;
    };
  }, []);

  useEffect(() => {
    if (language !== "en") return;

    let timers = scheduleTranslationRefresh();
    const handleContentReady = () => {
      timers.forEach(window.clearTimeout);
      timers = scheduleTranslationRefresh();
    };

    window.addEventListener(INTERFACE_CONTENT_READY_EVENT, handleContentReady);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener(INTERFACE_CONTENT_READY_EVENT, handleContentReady);
    };
  }, [language, pathname]);

  return (
    <>
      {children}
      <div id={ELEMENT_ID} aria-hidden="true" />
      {language === "en" ? (
        <Script
          id="google-website-translator"
          src="https://translate.google.com/translate_a/element.js?cb=hocamGoogleTranslateInit"
          strategy="afterInteractive"
          onLoad={initializeTranslator}
        />
      ) : null}
    </>
  );
}
