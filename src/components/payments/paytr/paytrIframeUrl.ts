/**
 * The one gate an iframe address has to pass before it is rendered.
 *
 * Everything else about the attempt is the server's word; this is the single
 * place the browser checks for itself, because embedding an attacker-supplied
 * origin would put a convincing card form inside a HOCAM page. Parsed with the
 * URL parser rather than matched as a prefix: "https://www.paytr.com.evil.example/"
 * starts with the right characters and is not the right host.
 */

const PAYTR_HOST = "www.paytr.com";
const PAYTR_PATH_PREFIX = "/odeme/guvenli/";

export function readPayTRIframeUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  // hostname, not host: a port would make this a different origin.
  if (url.hostname.toLowerCase() !== PAYTR_HOST) return null;
  if (url.port) return null;
  if (url.username || url.password) return null;
  if (!url.pathname.startsWith(PAYTR_PATH_PREFIX)) return null;

  const token = url.pathname.slice(PAYTR_PATH_PREFIX.length);
  if (!token) return null;

  return url.toString();
}
