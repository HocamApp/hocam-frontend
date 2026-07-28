/**
 * Storage access that can never break a flow. Every browser storage call here
 * is guarded: SSR has no window, Safari private mode throws on setItem, and a
 * full quota throws too. Losing persistence is acceptable; crashing is not.
 *
 * Modules take a StorageLike instead of reaching for globals so their tests can
 * inject an in-memory fake — the jsdom setup used by this repo does not define
 * localStorage/sessionStorage on globalThis.
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function getLocalStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSessionStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Returns the parsed value, or null for a missing key, unreadable storage or invalid JSON. */
export function readJson(storage: StorageLike | null, key: string): unknown {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Returns false when the value could not be stored, so callers can degrade instead of throwing. */
export function writeJson(
  storage: StorageLike | null,
  key: string,
  value: unknown
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(storage: StorageLike | null, key: string): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // A storage that cannot delete is still a storage we can ignore.
  }
}

/** In-memory StorageLike for tests and for browsers that deny persistent storage. */
export function createMemoryStorage(
  initial: Record<string, string> = {}
): StorageLike & { snapshot(): Record<string, string> } {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    snapshot: () => Object.fromEntries(map),
  };
}
