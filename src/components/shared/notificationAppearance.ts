/**
 * Icon and tile colour per notification.
 *
 * Taken straight from the supplied reference: the four emoji and the four hex
 * values are its own, used as given. Two more pairs are added in the same
 * language for families the reference has no equivalent for (a confirmation
 * and a problem), because the alternative was reusing a colour that already
 * means something else.
 *
 * This deliberately sits outside DESIGN.md's palette and its emoji ban. That
 * is the author's call, made explicitly, and it is recorded here so nobody
 * "corrects" it back later.
 *
 * Matched by family, not by name. The backend emits 57 distinct type strings
 * and adds a few every release, so a table keyed by exact value would be stale
 * within a month. Order matters — the first predicate that matches wins, so
 * the specific cases (a dispute is a `coaching_*` type too) come first.
 */

export type NotificationAppearance = {
  /** Emoji, rendered as text. */
  icon: string;
  /** Tile background, a literal hex from the reference. */
  color: string;
};

/* The reference's own four. */
const MONEY: NotificationAppearance = { icon: "💸", color: "#00C9A7" };
const PERSON: NotificationAppearance = { icon: "👤", color: "#FFB800" };
const MESSAGE: NotificationAppearance = { icon: "💬", color: "#FF3D71" };
const EVENT: NotificationAppearance = { icon: "🗞️", color: "#1E86FF" };

/* Two more in the same register, for cases the reference does not cover. */
const CONFIRMED: NotificationAppearance = { icon: "👍", color: "#22C55E" };
const PROBLEM: NotificationAppearance = { icon: "🚨", color: "#FF5630" };

type Rule = {
  match: (type: string, relatedObjectType: string) => boolean;
  appearance: NotificationAppearance;
};

const RULES: Rule[] = [
  {
    // Before the coaching and booking rules: a dispute is also a coaching
    // type, a cancellation is also a booking one.
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
      type === "tutor_leaving" ||
      type === "message_request_blocked",
    appearance: PROBLEM,
  },
  {
    match: (type) =>
      type.includes("confirmed") ||
      type.includes("accepted") ||
      type.includes("completed") ||
      type.includes("resolved"),
    appearance: CONFIRMED,
  },
  {
    // `_earning` rather than `earning`: "learning_plan_proposed" contains the
    // bare substring and was being painted as money.
    match: (type) =>
      type.includes("refund") ||
      type.includes("purchase") ||
      type.includes("_earning"),
    appearance: MONEY,
  },
  {
    match: (type, relatedObjectType) =>
      type === "message" ||
      type.startsWith("message_") ||
      type === "conversation" ||
      relatedObjectType === "conversation",
    appearance: MESSAGE,
  },
  {
    // Someone wants something from you — the reference's "user signed up".
    match: (type, relatedObjectType) =>
      type.startsWith("lesson_request") || relatedObjectType === "lesson_request",
    appearance: PERSON,
  },
];

/* Everything else is an event: bookings, coaching, plans, goals, and any type
   the backend adds tomorrow. */
const FALLBACK = EVENT;

export function getNotificationAppearance(
  type: string,
  relatedObjectType = ""
): NotificationAppearance {
  const rule = RULES.find((candidate) => candidate.match(type, relatedObjectType));
  return rule ? rule.appearance : FALLBACK;
}
