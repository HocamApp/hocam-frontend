"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Compass,
  GraduationCap,
  Heart,
  LayoutDashboard,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";
import { VERTICAL_TABS } from "@/lib/yemeksepetiMock";

type Props = {
  activeTab: string;
  onTabChange: (id: string) => void;
};

/** Same icons the real Hocam navbar uses, keyed by `navItems.ts` icon names. */
const TAB_ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  LayoutDashboard,
  Compass,
  CalendarDays,
};

/* Icon-only, exactly as in the Hocam navbar. No labels underneath, and no
   unread badge on the bell — a permanently lit badge on a page that has no
   notifications would be misinformation, not decoration. */
const UTILITY_ICONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "messages", label: "Mesajlar", Icon: MessageCircle },
  { id: "notifications", label: "Bildirimler", Icon: Bell },
  { id: "favorites", label: "Favoriler", Icon: Heart },
];

/*
 * When the hint appears, how long it stays, and how long its exit lasts.
 *
 * 6s of dwell is the Material snackbar band (4s short / 10s long) applied to
 * this sentence: ~11 Turkish words is roughly 3.5s of reading at 200wpm, and
 * the rest is the buffer for noticing it in the first place. Long enough to
 * finish reading, short enough that it never becomes furniture.
 */
const NUDGE_DELAY_MS = 900;
const NUDGE_VISIBLE_MS = 6000;
const NUDGE_EXIT_MS = 200;

export function YsNavbar({ activeTab, onTabChange }: Props) {
  /* A self-dismissing hint pointing at the register button, in the reference's
     coachmark style. It says nothing the button itself does not, so it is
     hidden from assistive tech rather than announced twice. */
  const [nudge, setNudge] = useState<"hidden" | "visible" | "leaving">("hidden");

  useEffect(() => {
    const timers = [
      setTimeout(() => setNudge("visible"), NUDGE_DELAY_MS),
      setTimeout(() => setNudge("leaving"), NUDGE_DELAY_MS + NUDGE_VISIBLE_MS),
      setTimeout(() => setNudge("hidden"), NUDGE_DELAY_MS + NUDGE_VISIBLE_MS + NUDGE_EXIT_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section
      className="sticky top-0 z-30 flex w-full flex-col bg-white"
      style={{ boxShadow: "var(--ys-elevation-low)" }}
    >
      <a
        href="#ys-main-content"
        className="ys-btn ys-btn--primary ys-btn--regular sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50"
      >
        Ana içeriğe geç
      </a>

      {/* Top row — brand on the left, account actions on the right. The
          address picker, language selector and cart the reference page
          carries have no Hocam counterpart and are gone. */}
      <header className="ys-shell flex h-16 items-center gap-2">
        <Link href="/" aria-label="Hocam ana sayfa" className="shrink-0">
          <BrandMark priority />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
          <Link href="/login" className="ys-btn ys-btn--secondary ys-btn--small">
            Giriş Yap
          </Link>
          <div className="relative">
            <Link href="/register" className="ys-btn ys-btn--primary ys-btn--small ys-from-md">
              Ücretsiz deneme dersi için kaydolun
            </Link>

            {nudge !== "hidden" && (
              <div
                className="ys-coachmark"
                data-leaving={nudge === "leaving"}
                aria-hidden
                onClick={() => setNudge("leaving")}
              >
                İstediğin hocayla 20 dakikalık ilk görüşmeni ücret ödemeden
                yapabilirsin. <strong>Kaydol</strong>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Bottom row — vertical switcher on the left, the account utility icons
          sitting directly under the auth buttons on the right. Neither is
          wired to a route yet; both are presentational. */}
      <div
        className="ys-shell flex items-center gap-4 border-t"
        style={{ borderColor: "var(--ys-neutral-divider)" }}
      >
        <div className="scrollbar-none flex min-w-0 flex-1 overflow-x-auto">
          {VERTICAL_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.icon];
            return (
              <button
                key={tab.id}
                type="button"
                className="ys-tab"
                data-selected={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
              >
                {Icon ? <Icon className="ys-tab__icon h-[18px] w-[18px]" aria-hidden /> : null}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="hidden shrink-0 items-center gap-1 border-l pl-3 md:flex"
          style={{ borderColor: "var(--ys-neutral-divider)" }}
        >
          {UTILITY_ICONS.map(({ id, label, Icon }) => (
            <button key={id} type="button" className="ys-icon-btn" aria-label={label}>
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
