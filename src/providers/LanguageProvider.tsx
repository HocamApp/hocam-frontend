"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  getStoredInterfaceLanguage,
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
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
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
