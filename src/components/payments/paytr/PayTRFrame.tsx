"use client";

import { readPayTRIframeUrl } from "./paytrIframeUrl";

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
}: {
  iframeUrl: string | null | undefined;
  className?: string;
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
      <h2 className="text-[1.375rem] font-semibold leading-8">Kartla ödeme</h2>
      <p className="mt-2 text-sm text-[#5c6b6d]">
        Kart bilgilerini PayTR ekranında gir.
      </p>
      <iframe
        src={safeUrl}
        title="PayTR güvenli ödeme"
        className="mt-4 block w-full min-h-[600px] border-0"
      />
    </section>
  );
}
