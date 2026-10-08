import {
  ArrowsLeftRight,
  CalendarX,
  CreditCard,
  UserMinus,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { Children, type ReactNode } from "react";

import { YsFact } from "./YsFact";
import { YsPillHeading } from "./YsPillHeading";
import { guarantees as copy } from "./ysHomeCopy";
import {
  CANCELLATION_FREE_HOURS,
  PAYMENT_CHARGED_WHEN,
  REMAINING_ON_SWITCH_TEXT,
  TUTOR_NO_SHOW_TEXT,
} from "./ysHomeFacts";

/**
 * "Ters giderse ne olur?", NEXT_PUBLIC_HOME_V2 only.
 *
 * Four questions a student asks before paying. Every answer has to say the
 * same thing as /iptal-ve-iade; the ones that are not settled yet (payment
 * timing, a tutor no-show, what happens to remaining lessons) are TODO facts,
 * and the policy answers come from DERS_POLITIKALARI_RAPORU.md, not from here.
 */
export function YsGuarantees() {
  const cards: { Icon: Icon; question: string; answer: ReactNode[] }[] = [
    {
      Icon: CreditCard,
      question: copy.payment.question,
      answer: copy.payment.answer(
        <YsFact value={PAYMENT_CHARGED_WHEN} label="Ödeme anı: ödeme sağlayıcısı canlıya alınınca" />,
      ),
    },
    {
      Icon: UserMinus,
      question: copy.noShow.question,
      answer: copy.noShow.answer(
        <YsFact value={TUTOR_NO_SHOW_TEXT} label="DERS_POLITIKALARI_RAPORU'ndan: hoca gelmezse ne olur" />,
      ),
    },
    {
      Icon: CalendarX,
      question: copy.cancel.question,
      answer: copy.cancel.answer(
        CANCELLATION_FREE_HOURS,
        <Link
          href="/iptal-ve-iade"
          className="font-medium text-pink underline-offset-2 hover:underline"
        >
          {copy.cancel.policyLink}
        </Link>,
      ),
    },
    {
      Icon: ArrowsLeftRight,
      question: copy.switchTutor.question,
      answer: copy.switchTutor.answer(<YsFact value={REMAINING_ON_SWITCH_TEXT} label="D6" />),
    },
  ];

  return (
    /* The top space sits outside `.ys-shell`, whose own padding and margin
       rules would override it. */
    <section aria-labelledby="ys-guarantees-title" className="mt-[88px] md:mt-[120px]">
      <div className="ys-shell">
        <YsPillHeading id="ys-guarantees-title" lead={copy.titleLead} pill={copy.titlePill} />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ Icon, question, answer }) => (
            <div
              key={question}
              className="flex min-w-0 flex-col gap-2.5 rounded-card border border-line bg-surface p-6"
            >
              <span className="grid size-11 place-items-center rounded-[12px] bg-paper text-ink">
                <Icon className="size-[22px]" aria-hidden />
              </span>
              <h3 className="mt-1.5 text-[18px] font-semibold leading-[25px]">{question}</h3>
              <p className="text-[15px] leading-6 text-ink-mid">{Children.toArray(answer)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
