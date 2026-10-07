import { isTodo } from "./ysHomeFacts";

/**
 * One fact from `ysHomeFacts.ts`, as it appears inside a sentence.
 *
 * A decided fact renders as its value. An undecided one (`TODO`) renders as
 * `[label]` in a dashed outline during development, so a reviewer sees the
 * hole where the number goes, and as nothing in production. Production should
 * never get that far: `scripts/check-home-facts.ts` fails the build first.
 *
 * Format the value before passing it (`formatPrice`, a range, a unit): this
 * only prints strings and numbers.
 */
export function YsFact({ value, label }: { value: unknown; label: string }): JSX.Element {
  if (isTodo(value)) {
    if (process.env.NODE_ENV === "production") return <></>;
    return (
      <span className="rounded-[4px] border border-dashed border-line px-1" data-todo-fact={label}>
        [{label}]
      </span>
    );
  }
  return <>{String(value)}</>;
}
