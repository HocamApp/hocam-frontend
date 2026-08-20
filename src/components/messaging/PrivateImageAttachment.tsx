"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fetchMessageAttachmentAccess } from "@/lib/messagingApi";
import { cn } from "@/lib/utils";

/**
 * Renders a private message image through the authorized attachment endpoint.
 *
 * The signed URL is short-lived (60s server-side) and therefore lives only in
 * component state for the lifetime of this mount.  It is never written into the
 * Message model, a query cache, or any storage, so a page refresh always
 * re-requests a fresh authorized URL.
 */

/** Bounded automatic re-requests, so an expired or failing URL cannot loop. */
export const MAX_IMAGE_ACCESS_RETRIES = 2;

type AccessStatus = "loading" | "ready" | "error";

interface PrivateImageAttachmentProps {
  attachmentId: string;
  /** Used for accessible naming only — never a storage path. */
  originalName?: string;
  isOwnMessage?: boolean;
}

export function PrivateImageAttachment({
  attachmentId,
  originalName,
  isOwnMessage = false,
}: PrivateImageAttachmentProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<AccessStatus>("loading");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const retriesRef = useRef(0);
  // Incremented per request so a resolved-but-stale response is discarded
  // instead of updating an unmounted or re-keyed component.
  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const requestAccess = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setStatus("loading");
    try {
      const access = await fetchMessageAttachmentAccess(attachmentId);
      if (!mountedRef.current || requestRef.current !== requestId) return;
      setUrl(access.url);
      setStatus("ready");
    } catch {
      if (!mountedRef.current || requestRef.current !== requestId) return;
      setUrl(null);
      setStatus("error");
    }
  }, [attachmentId]);

  useEffect(() => {
    retriesRef.current = 0;
    setUrl(null);
    void requestAccess();
  }, [requestAccess]);

  /** A failed <img> load usually means the signed URL expired — re-request once. */
  const handleImageError = useCallback(() => {
    if (retriesRef.current >= MAX_IMAGE_ACCESS_RETRIES) {
      setUrl(null);
      setStatus("error");
      return;
    }
    retriesRef.current += 1;
    void requestAccess();
  }, [requestAccess]);

  /** Manual retry resets the bounded counter — user-initiated, not a loop. */
  const handleManualRetry = useCallback(() => {
    retriesRef.current = 0;
    void requestAccess();
  }, [requestAccess]);

  const altText = originalName ? `Görsel ek: ${originalName}` : "Görsel ek";

  if (status === "error") {
    return (
      <div
        className={cn(
          "mb-2 rounded-lg border px-3 py-2 text-xs",
          isOwnMessage ? "border-primary-foreground/30 bg-primary-foreground/10" : "bg-background/60"
        )}
      >
        <p role="alert" className="mb-1">
          Görsel şu anda yüklenemedi.
        </p>
        <button
          type="button"
          onClick={handleManualRetry}
          className="underline underline-offset-2"
        >
          Yeniden dene
        </button>
      </div>
    );
  }

  if (status === "loading" || !url) {
    return (
      <div
        aria-busy="true"
        aria-label="Görsel yükleniyor"
        className="mb-2 h-32 w-40 animate-pulse rounded-lg bg-muted-foreground/20"
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPreviewOpen(true)}
        className="mb-2 block overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Görseli büyüt"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={altText}
          onError={handleImageError}
          className="max-w-full rounded-lg object-cover transition-transform duration-200 hover:scale-[1.01]"
          style={{ maxHeight: 220 }}
        />
      </button>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-2 shadow-none">
          <DialogTitle className="sr-only">Mesaj görseli</DialogTitle>
          <div className="overflow-hidden rounded-lg bg-background p-1 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Mesaj görseli"
              onError={handleImageError}
              className="max-h-[80vh] w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
