"use client";

import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, string | number>
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdApi;
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const LEGACY_GOOGLE_CLIENT_ID =
  "778217883133-d9ifohhgl5b9rk4nqndn4blh0tccd2tr.apps.googleusercontent.com";
const HOCAM_GOOGLE_CLIENT_ID =
  "527118401129-b6pmos468s2hb40tdp2fu868ctu0o47k.apps.googleusercontent.com";

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GIS load failed"));
    document.head.appendChild(script);
  });
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

/**
 * Renders the official Google Identity Services button. On success it hands the
 * returned ID token (credential) to `onCredential`. Renders a small notice if
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.
 */
export function GoogleSignInButton({
  onCredential,
  text = "continue_with",
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const configuredClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  // The custom-domain Vercel project still injects the retired public client
  // ID. Translate only that known legacy value while preserving normal env
  // overrides everywhere else.
  const clientId =
    configuredClientId === LEGACY_GOOGLE_CLIENT_ID
      ? HOCAM_GOOGLE_CLIENT_ID
      : configuredClientId;

  useEffect(() => {
    if (!clientId || !containerRef.current) return;
    let cancelled = false;
    setLoadFailed(false);

    loadGisScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) onCredential(response.credential);
          },
        });
        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text,
          shape: "pill",
          width: 320,
          logo_alignment: "center",
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, text]);

  if (!clientId) {
    return (
      <p className="text-center text-xs text-neutral-500">
        Google ile giriş şu anda kullanılamıyor.
      </p>
    );
  }

  if (loadFailed) {
    return (
      <p className="text-center text-xs text-neutral-500">
        Google ile giriş yüklenemedi. Lütfen daha sonra tekrar deneyin.
      </p>
    );
  }

  return <div ref={containerRef} className="flex min-h-10 justify-center" />;
}
