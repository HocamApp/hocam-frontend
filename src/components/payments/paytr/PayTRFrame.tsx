"use client";

import type { Ref } from "react";
import Script from "next/script";

import { PAYTR_ENABLED } from "@/lib/featureFlags";

import { readPayTRIframeUrl } from "./paytrIframeUrl";

/**
 * PayTR's own iFrame integration, step 1
 * (dev.paytr.com/iframe-api/iframe-api-1-adim): the frame carries
 * id="paytriframe", the page loads this script from PayTR and calls
 * iFrameResize({},'#paytriframe') so the frame grows with PayTR's content
 * instead of scrolling inside a fixed box.
 *
 * It is a third-party script running on our origin, loaded only with
 * payments built in and only while a verified PayTR frame is on screen. If
 * it never loads, the 600px floor and scrolling inside the frame remain.
 */
const PAYTR_RESIZER_SRC = "https://www.paytr.com/js/iframeResizer.min.js";
const PAYTR_FRAME_ID = "paytriframe";

declare global {
  interface Window {
    iFrameResize?: (options: object, target: string | HTMLElement) => unknown;
  }
}

/**
 * PayTR's hosted payment form, embedded as the provider serves it.
 *
 * Nothing of HOCAM's is drawn over it: no overlay, no second pay button, no
 * card fields around it. The address is verified here rather than trusted,
 * and an address that fails renders no frame at all. There is no `sandbox`
 * attribute — the bank redirects and 3D Secure challenges inside this frame
 * have not been tested against one, and a guess would break real payments.
 */
export function PayTRFrame({
  iframeUrl,
  className,
  headingRef,
}: {
  iframeUrl: string | null | undefined;
  className?: string;
  /** Lets the payment screen move focus here when the frame opens. */
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const safeUrl = readPayTRIframeUrl(iframeUrl);

  if (!safeUrl) {
    return (
      <section
        className={`rounded-[20px] border border-[#e6dddd] bg-white p-4 text-[#02171a] sm:p-6 ${className ?? ""}`}
      >
        <h2 className="text-[1.375rem] font-semibold leading-8">
          Kartla ödeme
        </h2>
        <p className="mt-2 text-sm text-[#b33a24]">
          Ödeme ekranı güvenli şekilde açılamadı.
        </p>
        <p className="mt-2 text-sm text-[#5c6b6d]">
          Paketlerim alanından güncel durumu kontrol edebilirsin.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[20px] border border-[#e6dddd] bg-white p-4 text-[#02171a] sm:p-6 ${className ?? ""}`}
    >
      {headingRef ? (
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-[1.375rem] font-semibold leading-8 focus-visible:outline-none"
        >
          Kartla ödeme
        </h2>
      ) : (
        <h2 className="text-[1.375rem] font-semibold leading-8">Kartla ödeme</h2>
      )}
      <p className="mt-2 text-sm text-[#5c6b6d]">
        Kart bilgilerini PayTR ekranında gir.
      </p>
      <iframe
        id={PAYTR_ENABLED ? PAYTR_FRAME_ID : undefined}
        src={safeUrl}
        title="PayTR güvenli ödeme"
        className="mt-4 block w-full min-h-[600px] border-0"
      />
      {PAYTR_ENABLED && (
        <Script
          src={PAYTR_RESIZER_SRC}
          strategy="afterInteractive"
          onReady={() => {
            window.iFrameResize?.({}, `#${PAYTR_FRAME_ID}`);
          }}
        />
      )}
    </section>
  );
}
