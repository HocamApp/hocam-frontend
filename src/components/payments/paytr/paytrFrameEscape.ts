/**
 * PayTR's return URLs may open inside the payment iframe on our own page
 * rather than in the top window — its docs do not say which. A return screen
 * that finds itself framed hands the whole tab over to the same address
 * instead of rendering inside the provider's box.
 */

type FrameWindow = {
  self: unknown;
  top: { location: { replace: (href: string) => void } } | null;
  location: { href: string };
};

/** True when this document is not the top window. Unreadable counts as framed. */
export function isFramedWindow(win: FrameWindow): boolean {
  try {
    return win.top !== null && win.top !== win.self;
  } catch {
    return true;
  }
}

/** Moves the top window to this document's address. False if it may not. */
export function moveTopWindowHere(win: FrameWindow): boolean {
  try {
    if (!win.top) return false;
    win.top.location.replace(win.location.href);
    return true;
  } catch {
    return false;
  }
}

export function isFramed(): boolean {
  if (typeof window === "undefined") return false;
  return isFramedWindow(window as unknown as FrameWindow);
}

export function moveTopHere(): boolean {
  if (typeof window === "undefined") return false;
  return moveTopWindowHere(window as unknown as FrameWindow);
}
