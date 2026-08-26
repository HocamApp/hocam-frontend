"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Loads the canonical public notice as same-origin HTML and renders its main
 * content directly in the registration dialog. This keeps the modal in sync
 * with the public page without weakening the global anti-framing header.
 */
export function AydinlatmaMetniPreview({ onReady }: { onReady: () => void }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNotice() {
      try {
        const response = await fetch("/kvkk/aydinlatma-metni", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Notice request failed");

        const documentHtml = await response.text();
        const parsed = new DOMParser().parseFromString(documentHtml, "text/html");
        const main = parsed.querySelector("main");
        if (!main) throw new Error("Notice content missing");

        // The source is a trusted, static same-origin page. Remove executable
        // or document-level elements defensively before inserting its markup.
        main.querySelectorAll("script, style, link, meta").forEach((node) => node.remove());
        setHtml(main.innerHTML);
        onReady();
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFailed(true);
      }
    }

    void loadNotice();
    return () => controller.abort();
  }, [onReady]);

  if (failed) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Aydınlatma Metni şu anda bu pencerede yüklenemedi.
        </p>
        <Link
          href="/kvkk/aydinlatma-metni"
          target="_blank"
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Metni yeni sekmede aç
        </Link>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex min-h-64 items-center justify-center p-6 text-sm text-muted-foreground">
        Aydınlatma Metni yükleniyor…
      </div>
    );
  }

  return (
    <article
      className="mx-auto max-w-3xl p-6 text-foreground sm:p-8 [&>div:last-child]:pb-4 [&>div:last-child]:pt-8 [&>h1]:text-2xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
