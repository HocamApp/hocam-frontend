import type { Icon } from "@phosphor-icons/react";
import {
  Bell,
  CalendarCheck,
  ChatCircle,
  CheckCircle,
  Compass,
  Student,
  Target,
  Wallet,
  Warning,
} from "@phosphor-icons/react";

/**
 * What a notification looks like: an icon and the surface behind it.
 *
 * The reference design gives every row a coloured tile with an emoji in it.
 * Neither half survives contact with DESIGN.md, so both are translated rather
 * than copied:
 *
 * - **Emoji are banned outright**, product and marketing alike, so these are
 *   Phosphor glyphs at the same weight the rest of the app uses.
 * - **The palette is capped at three hues plus neutrals.** The reference uses
 *   blue, pink, amber and teal, which would be four new ones. These tiles use
 *   only colours the system already owns, and each carries meaning rather than
 *   variety: ink is the default, pink is conversation, gold is money, success
 *   is a confirmation, error is a problem.
 *
 * Every tile is a solid fill with an inverted glyph, which is the sanctioned
 * badge construction. Gold is the exception that proves it: `--gold-ink` sits
 * on gold, never white, because #FFD100 needs a dark mark on it.
 *
 * Matched by family, not by name. The backend emits 57 distinct type strings
 * and grows a few every release; a lookup table keyed by exact value would be
 * stale within a month and would fall through to a generic bell without anyone
 * noticing. Order matters — the first predicate that matches wins, so the
 * specific cases (a dispute is a `coaching_*` type too) are listed first.
 */

export type NotificationTone = "ink" | "pink" | "gold" | "success" | "error";

export type NotificationAppearance = {
  icon: Icon;
  tone: NotificationTone;
};

/** Tailwind classes per tone. Solid fill, inverted glyph. */
export const NOTIFICATION_TONE_CLASS: Record<NotificationTone, string> = {
  ink: "bg-ink text-paper",
  pink: "bg-pink text-white",
  gold: "bg-gold text-gold-ink",
  success: "bg-success text-white",
  error: "bg-error text-white",
};

type Rule = {
  match: (type: string, relatedObjectType: string) => boolean;
  appearance: NotificationAppearance;
};

const RULES: Rule[] = [
  {
    // Anything that went wrong, before the coaching rule can claim the
    // disputes and the booking rule can claim the cancellations.
    match: (type) =>
      type.includes("dispute") ||
      type.includes("sla") ||
      type.includes("cancel") ||
      type.includes("declined") ||
      type.includes("overdue") ||
      type.includes("absence") ||
      type === "technical_failure" ||
      type === "trust_safety_flag" ||
      type === "tutor_auto_hidden" ||
      type === "message_request_blocked",
    appearance: { icon: Warning, tone: "error" },
  },
  {
    match: (type) =>
      type.includes("confirmed") ||
      type.includes("accepted") ||
      type.includes("completed") ||
      type.includes("resolved"),
    appearance: { icon: CheckCircle, tone: "success" },
  },
  {
    // Money, which is the one thing gold is for outside the YKS rank.
    match: (type) =>
      type.includes("refund") ||
      type.includes("purchase") ||
      type.includes("earning"),
    appearance: { icon: Wallet, tone: "gold" },
  },
  {
    match: (type, relatedObjectType) =>
      type === "message" ||
      type.startsWith("message_") ||
      type === "conversation" ||
      relatedObjectType === "conversation",
    appearance: { icon: ChatCircle, tone: "pink" },
  },
  {
    match: (type, relatedObjectType) =>
      type.startsWith("booking") ||
      type === "reschedule" ||
      relatedObjectType === "booking",
    appearance: { icon: CalendarCheck, tone: "ink" },
  },
  {
    match: (type, relatedObjectType) =>
      type.startsWith("lesson_request") || relatedObjectType === "lesson_request",
    appearance: { icon: Student, tone: "ink" },
  },
  {
    match: (type) => type.includes("plan") || type.includes("goal"),
    appearance: { icon: Target, tone: "ink" },
  },
  {
    match: (type) => type.startsWith("coaching"),
    appearance: { icon: Compass, tone: "ink" },
  },
];

const FALLBACK: NotificationAppearance = { icon: Bell, tone: "ink" };

export function getNotificationAppearance(
  type: string,
  relatedObjectType = ""
): NotificationAppearance {
  const rule = RULES.find((candidate) => candidate.match(type, relatedObjectType));
  return rule ? rule.appearance : FALLBACK;
}
