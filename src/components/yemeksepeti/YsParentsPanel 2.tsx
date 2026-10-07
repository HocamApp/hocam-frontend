import {
  ArrowRight,
  ChatCircle,
  Receipt,
  ShieldCheck,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { YsFact } from "./YsFact";
import { parents as copy } from "./ysHomeCopy";
import {
  PARENT_CAN_JOIN_TEXT,
  PARENT_CAN_PAY_TEXT,
  RECORDING_POLICY_TEXT,
  SUPPORT_REPLY_TEXT,
} from "./ysHomeFacts";

/**
 * "Veliler için" (#veliler), NEXT_PUBLIC_HOME_V2 only.
 *
 * Only what the product actually does today. Messaging opens after a lesson
 * request, which is how it works now; recording, a parent joining, a parent
 * paying and support reply time are TODO facts until the owners decide them.
 *
 * `className` lets the /veliler page reuse the panel without the homepage's
 * 120px lead-in.
 */
export function YsParentsPanel({ className }: { className?: string }) {
  const rows: { Icon: Icon; title: string; body: ReactNode[] }[] = [
    { Icon: ShieldCheck, title: copy.onPlatform.title, body: [copy.onPlatform.body] },
    {
      Icon: VideoCamera,
      title: copy.recording.title,
      body: copy.recording.body(
        <YsFact value={RECORDING_POLICY_TEXT} label="Dersler kaydediliyor mu: D10" />,
        <YsFact value={PARENT_CAN_JOIN_TEXT} label="Veli derse girebilir mi: D10" />,
      ),
    },
    {
      Icon: Receipt,
      title: copy.payment.title,
      body: copy.payment.body(
        <YsFact value={PARENT_CAN_PAY_TEXT} label="Veli çocuğu adına ödeyebilir mi: D14" />,
      ),
    },
    {
      Icon: ChatCircle,
      title: copy.support.title,
      body: copy.support.body(<YsFact value={SUPPORT_REPLY_TEXT} label="X saat" />),
    },
  ];

  return (
    <section
      id="veliler"
      aria-labelledby="ys-parents-title"
      className={cn("ys-shell scroll-mt-[calc(var(--app-header-h)+24px)]", className)}
    >
      <div className="rounded-card bg-surface px-6 py-8 lg:p-16">
        <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="min-w-0">
            <h2
              id="ys-parents-title"
              className="text-[32px] font-bold leading-9 md:text-[44px] md:leading-[46px] md:tracking-[-0.88px]"
            >
              {copy.title}
            </h2>
            <p className="mt-4 max-w-[36ch] text-body-l leading-[29px] text-ink-mid">{copy.lead}</p>
            <Link
              href="/veliler"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-pill border border-ink px-8 text-body font-semibold text-ink transition-colors duration-[--duration-state] hover:bg-ink hover:text-paper"
            >
              {copy.cta}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="flex min-w-0 flex-col">
            {rows.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 border-t border-line py-[22px] first:border-t-0 first:pt-0"
              >
                <span className="grid size-11 place-items-center rounded-[12px] bg-paper text-ink">
                  <Icon className="size-[22px]" aria-hidden />
                </span>
                <div>
                  <h3 className="text-[18px] font-semibold leading-[26px]">{title}</h3>
                  <p className="mt-1 text-[15px] leading-6 text-ink-mid">{Children.toArray(body)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
