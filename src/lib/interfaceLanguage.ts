const STORAGE_KEY = "hocam-interface-language";
const GOOGLE_TRANSLATE_COOKIE = "googtrans";

function expireGoogleTranslateCookie(domain?: string) {
  const domainAttribute = domain ? `; domain=${domain}` : "";
  document.cookie = `${GOOGLE_TRANSLATE_COOKIE}=; path=/; max-age=0; SameSite=Lax${domainAttribute}`;
}

/**
 * Removes state left by the retired Google Website Translator integration.
 * Google used both host-only and parent-domain cookies, so clear both forms.
 */
export function clearLegacyAutomaticTranslation() {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, "tr");
  document.documentElement.lang = "tr";
  expireGoogleTranslateCookie();

  const hostname = window.location.hostname;
  if (hostname) {
    expireGoogleTranslateCookie(hostname);
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      expireGoogleTranslateCookie(`.${parts.slice(-2).join(".")}`);
    }
  }
}
