"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Pulls the document body out of a rendered legal page.
 *
 * The page's <main> also carries the legal-docs sidebar, which on a phone
 * stacks above the text and pushes it below the fold, so only the <article>
 * is kept. Links open in a new tab: following one inside the sheet would
 * navigate away from a half-filled registration form.
 */
export function extractLegalDocumentHtml(documentHtml: string): string | null {
  const parsed = new DOMParser().parseFromString(documentHtml, "text/html");
  const main = parsed.querySelector("main");
  const content = main?.querySelector("article") ?? main;
  if (!content) return null;

  // The source is a trusted, static same-origin page. Remove executable
  // or document-level elements defensively before inserting its markup.
  content.querySelectorAll("script, style, link, meta, nav").forEach((node) => node.remove());
  content.querySelectorAll("a[href]").forEach((anchor) => {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  });
  return content.innerHTML;
}

/**
 * Loads a published legal page as same-origin HTML and renders its document
 * content inline. This keeps the sheet in sync with the public page without
 * weakening the global anti-framing header.
 */
export function LegalDocumentPreview({ url }: { url: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setHtml(null);
    setFailed(false);

    async function loadDocument() {
      try {
        const response = await fetch(url, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Legal document request failed");

        const content = extractLegalDocumentHtml(await response.text());
        if (!content) throw new Error("Legal document content missing");
        setHtml(content);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFailed(true);
      }
    }

    void loadDocument();
    return () => controller.abort();
  }, [url]);

  if (failed) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Metin şu anda bu pencerede yüklenemedi.
        </p>
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
        >
          Metni yeni sekmede aç
        </Link>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex min-h-64 items-center justify-center p-6 text-sm text-muted-foreground">
        Metin yükleniyor…
      </div>
    );
  }

  return (
    <article
      className="mx-auto max-w-3xl px-5 py-6 text-ink sm:px-8 sm:py-8"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
