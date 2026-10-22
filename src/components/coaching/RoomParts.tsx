"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { WifiSlash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { roomRefetchDelay, type RoomClock } from "@/lib/coachingRoom";
import { serverNow } from "@/lib/serverClock";

/**
 * The frame around the coaching video room. The video itself (Jitsi) is not part
 * of it and nothing here reaches into it. A dark bar says whose meeting it is and
 * how much of it is left; on a desktop a side panel opens beside the video, on a
 * phone the same parts open under it from a bar of three buttons. Plain class
 * strings throughout: tailwind-merge would drop a named size next to a colour.
 */

/** The parts of the panel. On a phone one at a time; on a desktop all of them, in this order. */
export type RoomPanelView = "dosyalar" | "rapor" | "sorun";

/** The dark bar: the person, the meeting's own line, the time left, and what the person can do from here. */
export function RoomTopBar({
  title,
  meta,
  clock,
  summaryHref,
  panelOpen,
  onTogglePanel,
}: {
  title: string;
  meta: string;
  /** Null until the meeting is known. */
  clock: RoomClock | null;
  /** Where the screen after the meeting is; offered once the time is up. */
  summaryHref: string | null;
  panelOpen: boolean;
  onTogglePanel: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-ink px-4 py-3 text-paper sm:px-5">
      <div className="min-w-0 flex-1 basis-40">
        <h1 className="truncate text-body font-medium">{title}</h1>
        {meta ? <p className="truncate text-label tabular-nums">{meta}</p> : null}
      </div>
      {clock ? (
        <p
          className={`rounded-pill px-3 py-0.5 text-small tabular-nums ${
            clock.urgent ? "bg-pink-deep font-medium text-white" : "border border-paper text-paper"
          }`}
        >
          {clock.label}
        </p>
      ) : null}
      {clock?.phase === "over" && summaryHref ? (
        <Button asChild size="sm" variant="gold" className="min-h-11">
          <Link href={summaryHref}>Görüşme özeti</Link>
        </Button>
      ) : null}
      <button
        type="button"
        aria-expanded={panelOpen}
        aria-controls="oda-paneli"
        onClick={onTogglePanel}
        className={`hidden min-h-11 items-center rounded-pill border border-paper px-4 text-small font-medium md:inline-flex ${
          panelOpen ? "bg-paper text-ink" : "text-paper hover:bg-paper hover:text-ink"
        }`}
      >
        Panel
      </button>
    </header>
  );
}

/** What a phone has instead of the Panel button: one button per part, the open one pressed. */
export function RoomBottomBar({
  items,
  active,
  onSelect,
}: {
  items: readonly { key: RoomPanelView; label: string; icon: ReactNode }[];
  active: RoomPanelView | null;
  onSelect: (key: RoomPanelView) => void;
}) {
  return (
    <nav aria-label="Görüşme paneli" className="flex border-t border-line bg-surface md:hidden">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={active === item.key}
          aria-controls={`oda-${item.key}`}
          onClick={() => onSelect(item.key)}
          className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 text-label ${
            active === item.key ? "border-ink font-medium text-ink" : "border-transparent text-ink-mid"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}

/**
 * The side panel. On a phone it is shut until a part is chosen from the bottom bar
 * and then sits under the video; on a desktop it is a column beside the video that
 * the Panel button opens and closes.
 */
export function RoomPanel({
  view,
  desktopOpen,
  children,
}: {
  view: RoomPanelView | null;
  desktopOpen: boolean;
  children: ReactNode;
}) {
  return (
    <aside
      id="oda-paneli"
      aria-label="Görüşme paneli"
      className={`${view ? "flex" : "hidden"} ${desktopOpen ? "md:flex" : "md:hidden"} max-h-[45vh] min-h-0 flex-col gap-5 overflow-y-auto border-t border-line bg-surface p-4 text-ink md:max-h-none md:basis-[35%] md:border-l md:border-t-0`}
    >
      {children}
    </aside>
  );
}

/** One part of the panel. Kept mounted while hidden, so a half-written draft or note is not lost. */
export function RoomPanelSection({
  id,
  view,
  children,
}: {
  id: RoomPanelView;
  view: RoomPanelView | null;
  children: ReactNode;
}) {
  return (
    <section
      id={`oda-${id}`}
      className={`${view === id ? "block" : "hidden md:block"} md:border-t md:border-line md:pt-5 md:first:border-t-0 md:first:pt-0`}
    >
      {children}
    </section>
  );
}

/** Where the video would be, when it cannot be: a title, a sentence, a count, and what to do. */
export function RoomStateCard({
  title,
  message,
  countdown,
  children,
}: {
  title: string;
  message: string;
  countdown: string | null;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="oda-durumu" className="m-4 w-full max-w-sm rounded-card bg-surface p-6 text-ink">
      <h2 id="oda-durumu" className="text-h3-m font-bold md:text-h3 md:font-bold">
        {title}
      </h2>
      {message ? <p className="mt-2 text-body text-ink-mid">{message}</p> : null}
      {countdown ? (
        <p className="mt-3 inline-flex rounded-pill border border-ink px-3 py-0.5 text-small tabular-nums">{countdown}</p>
      ) : null}
      {children ? <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div> : null}
    </section>
  );
}

/** The connection dropped and is being tried again. */
export function RoomConnectionStrip() {
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-danger px-4 py-2 text-center text-small font-medium text-white">
      <WifiSlash className="h-4 w-4" aria-hidden="true" />
      Bağlantı koptu. Yeniden bağlanmaya çalışılıyor…
    </div>
  );
}

/**
 * Asks for the room the moment it opens, instead of at the next turn of a slow
 * poll: one timer, set from the server's clock, cleared when the screen goes away.
 */
export function useRoomOpenTimer(opensAt: number | null, onOpen: () => void): void {
  const latest = useRef(onOpen);
  latest.current = onOpen;
  useEffect(() => {
    if (opensAt === null) return;
    const delay = roomRefetchDelay(opensAt, new Date(serverNow()));
    if (delay === null) return;
    const id = setTimeout(() => latest.current(), delay);
    return () => clearTimeout(id);
  }, [opensAt]);
}
