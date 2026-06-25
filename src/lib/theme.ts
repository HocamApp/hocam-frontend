export const THEME_STORAGE_KEY = "hocam-theme";

export type Theme = "light" | "dark";

/** Read the persisted theme. Defaults to "light" (light is the app default). */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Toggle the `dark` class on <html> to match the given theme. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Persist the theme to localStorage immediately and apply it to the document. */
export function setTheme(theme: Theme): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore storage errors */
    }
  }
  applyTheme(theme);
}

/**
 * Inline script (stringified) injected into <head> so the saved theme is applied
 * before first paint, avoiding a flash of the wrong theme. Keeps light as default.
 */
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;
