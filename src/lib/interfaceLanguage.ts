export type InterfaceLanguage = "tr" | "en";

const STORAGE_KEY = "hocam-interface-language";
const GOOGLE_TRANSLATE_COOKIE = "googtrans";
export const INTERFACE_CONTENT_READY_EVENT = "hocam:interface-content-ready";

export function isInterfaceLanguage(value: string): value is InterfaceLanguage {
  return value === "tr" || value === "en";
}

export function getStoredInterfaceLanguage(): InterfaceLanguage {
  if (typeof window === "undefined") return "tr";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isInterfaceLanguage(stored) ? stored : "tr";
}

export function hasStoredInterfaceLanguage(): boolean {
  if (typeof window === "undefined") return false;
  return isInterfaceLanguage(window.localStorage.getItem(STORAGE_KEY) ?? "");
}

function setGoogleTranslateCookie(language: InterfaceLanguage) {
  const value = language === "en" ? "/tr/en" : "/tr/tr";
  const cookie = `${GOOGLE_TRANSLATE_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = cookie;
}

/**
 * Persists and immediately applies the interface language. A reload is
 * intentional: Google Website Translator reads its language cookie at page
 * startup and can then translate every route, including legacy hard-coded UI.
 */
export function applyInterfaceLanguage(language: InterfaceLanguage) {
  window.localStorage.setItem(STORAGE_KEY, language);
  document.documentElement.lang = language;
  setGoogleTranslateCookie(language);
  window.location.reload();
}

/** Notify the translator when a route replaces its loading state with real UI. */
export function announceInterfaceContentReady() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INTERFACE_CONTENT_READY_EVENT));
}
