"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { trackHocaBul } from "@/lib/hocaBulAnalytics";
import {
  buildEntryHref,
  resolveEntryState,
  type HocaBulEntryState,
} from "@/lib/hocaBulEntryState";
import { getLocalStorage, getSessionStorage, type StorageLike } from "@/lib/safeStorage";
import { cn } from "@/lib/utils";
import { IllustrationFrame } from "@/components/hoca-bul/illustrations/IllustrationFrame";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HocaBulGoal } from "@/types/hocaBul";

/**
 * The single entry point from the authenticated student home into /hoca-bul.
 *
 * Deliberately prop-free in production: it resolves its own state from storage
 * and renders zero server data, so adding it to the home page is one JSX block
 * with no data, callbacks or analytics wiring passed down.
 *
 * The state it shows is resolved in one client effect, after useAuth() knows
 * who the student is — never during server rendering, and never from another
 * account's data. Until then it renders the fresh variant, which is also the
 * server-rendered markup, so hydration matches and no draft or result is
 * claimed before it is known to exist.
 */
export interface HocaBulEntryCardProps {
  /** Test seam only. Production omits these; the card resolves them itself. */
  storageOverride?: { local: StorageLike | null; session: StorageLike | null };
  nowOverride?: number;
}

const GOAL_CHIPS: ReadonlyArray<{ value: HocaBulGoal; label: string }> = [
  { value: "YKS", label: "YKS" },
  { value: "DGS", label: "DGS" },
  { value: "KPSS", label: "KPSS" },
  { value: "UNDECIDED", label: "Henüz karar vermedim" },
];

/**
 * "Henüz karar vermedim için hocamı bul" is not a sentence, so the undecided
 * chip gets its own contextual call to action rather than the goal template.
 */
const UNDECIDED_CTA = "Karar vermeden devam et";

const CHIP_GROUP_LABEL_ID = "hoca-bul-entry-goal-label";
const TITLE_ID = "hoca-bul-entry-title";

export function HocaBulEntryCard({
  storageOverride,
  nowOverride,
}: HocaBulEntryCardProps = {}) {
  const { user } = useAuth();
  const userId = user?.id;

  const [entry, setEntry] = useState<HocaBulEntryState>({ kind: "loading" });
  const [goal, setGoal] = useState<HocaBulGoal | null>(null);

  useEffect(() => {
    if (!userId) return;
    setEntry(
      resolveEntryState({
        userId,
        local: storageOverride ? storageOverride.local : getLocalStorage(),
        session: storageOverride ? storageOverride.session : getSessionStorage(),
        now: nowOverride,
      })
    );
  }, [nowOverride, storageOverride, userId]);

  // Hydration renders exactly the fresh card, so the first paint never has to
  // be replaced by something shorter or longer than what it claimed.
  const variant = entry.kind === "loading" ? "fresh" : entry.kind;

  const primary =
    entry.kind === "draft"
      ? {
          label: "Devam et",
          href: buildEntryHref({ kind: "draft", stepId: entry.stepId }),
        }
      : variant === "result"
        ? { label: "Eşleşmelerimi gör", href: buildEntryHref({ kind: "result" }) }
        : {
            label: !goal
              ? "Hocamı bul"
              : goal === "UNDECIDED"
                ? UNDECIDED_CTA
                : `${goal} için hocamı bul`,
            href: buildEntryHref({ kind: "fresh", goal }),
          };

  const secondary =
    variant === "result"
      ? {
          label: "Tercihlerimi güncelle",
          href: buildEntryHref({ kind: "resultEdit" }),
        }
      : { label: "Tüm hocalara göz at", href: "/tutors" };

  const title =
    variant === "draft"
      ? "Kaldığın yerden devam et"
      : variant === "result"
        ? "Sana uygun hocaları tekrar gör"
        : "Sana uygun hocayı 2 dakikada bulalım";

  return (
    <MotionConfig reducedMotion="user">
      <section aria-labelledby={TITLE_ID}>
        <Card
          className="overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-sm"
          data-state={variant}
        >
          <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center lg:gap-10">
            <div className="flex min-w-0 flex-col justify-center gap-4 lg:min-h-[14rem]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {variant === "result" ? "EŞLEŞMEN HAZIR" : "SANA ÖZEL"}
              </p>

              <h2
                id={TITLE_ID}
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                {title}
              </h2>

              {variant === "fresh" && (
                <>
                  {/* Two elements toggled with CSS rather than a JS media query:
                      a query would render the wrong string on the server. The
                      inactive one is display:none, which already removes it from
                      the accessibility tree, so exactly one is ever announced —
                      an aria-hidden here would silence one viewport entirely. */}
                  <p className="hidden text-sm leading-6 text-muted-foreground sm:block">
                    Hedefini, seviyeni ve programını birkaç soruda anla; doğrulanmış
                    hocalar arasından sana uyanları nedenleriyle gösterelim.
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground sm:hidden">
                    Birkaç soruda hedefini anla, sana uyan doğrulanmış hocaları gör.
                  </p>
                </>
              )}

              {entry.kind === "draft" && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {entry.humanIndex}. sorudan devam edeceksin.
                </p>
              )}

              {variant === "fresh" && (
                <div className="space-y-2.5">
                  <p
                    id={CHIP_GROUP_LABEL_ID}
                    className="text-sm font-medium text-foreground"
                  >
                    Neye hazırlanıyorsun?
                  </p>
                  <div
                    role="group"
                    aria-labelledby={CHIP_GROUP_LABEL_ID}
                    className="flex flex-wrap gap-2"
                  >
                    {GOAL_CHIPS.map((chip) => {
                      const selected = goal === chip.value;
                      return (
                        <button
                          key={chip.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setGoal((current) =>
                              current === chip.value ? null : chip.value
                            )
                          }
                          className={cn(
                            "inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium transition-colors motion-reduce:transition-none",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            selected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="min-h-11 w-full rounded-xl sm:w-auto"
                >
                  <Link
                    href={primary.href}
                    onClick={() =>
                      trackHocaBul({
                        event: "home_matching_started",
                        state: variant,
                        ...(variant === "fresh" && goal ? { goal } : {}),
                      })
                    }
                  >
                    {primary.label}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="min-h-11 w-full rounded-xl sm:w-auto"
                >
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              </div>
            </div>

            {/* Only where there is a real second column. Stacked under the copy
                on tablet the artwork became a band of empty space rather than
                support for the question. */}
            <div className="hidden h-52 w-full lg:block">
              <IllustrationFrame state={{ step: "hedef", goal }} />
            </div>
          </CardContent>
        </Card>
      </section>
    </MotionConfig>
  );
}
