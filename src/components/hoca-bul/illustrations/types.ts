import type { HocaBulStepId } from "@/types/hocaBul";
import type { IllustrationStateFor } from "./illustrationState";

/**
 * What every artwork receives, and deliberately all it receives.
 *
 * `state` is already narrowed to one step, so a component cannot reach another
 * step's shape — or the wizard's answers, reducer or options — even by accident.
 *
 * `reduced` is resolved once by the frame rather than by each artwork: nine
 * components subscribing to the same media query would be nine subscriptions for
 * one answer.
 */
export interface StepIllustrationProps<
  Step extends HocaBulStepId = HocaBulStepId,
> {
  state: IllustrationStateFor<Step>;
  /** The band above the question on tablet and mobile, where height is scarce. */
  compact?: boolean;
  reduced: boolean;
}
