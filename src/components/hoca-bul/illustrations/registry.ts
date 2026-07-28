import { createElement, type ReactElement } from "react";

import type { HocaBulStepId } from "@/types/hocaBul";
import { DerslerIllustration } from "./DerslerIllustration";
import { HedefIllustration } from "./HedefIllustration";
import { PendingIllustration } from "./PendingIllustration";
import { UygunZamanlarIllustration } from "./UygunZamanlarIllustration";
import type { IllustrationState } from "./illustrationState";

/**
 * State to artwork.
 *
 * A switch rather than a lookup table: `state` is a discriminated union, and only
 * a switch lets the compiler hand each artwork its own narrowed member without a
 * cast. The `never` fallthrough means adding a step to HocaBulStepId fails the
 * build here instead of silently rendering nothing.
 *
 * This is not a second step registry — it holds no ordering, no branching and no
 * navigation. hocaBulFlow remains the only step machine.
 *
 * Statically imported on purpose: the desktop column cross-fades two artworks at
 * once, so a dynamic import would blank it on every step change, and the whole
 * set is a few kilobytes of JSX.
 */
export function renderIllustration(
  state: IllustrationState,
  options: { compact: boolean; reduced: boolean }
): ReactElement {
  const { compact, reduced } = options;

  switch (state.step) {
    case "hedef":
      return createElement(HedefIllustration, { state, compact, reduced });
    case "dersler":
      return createElement(DerslerIllustration, { state, compact, reduced });
    case "uygun_zamanlar":
      return createElement(UygunZamanlarIllustration, { state, compact, reduced });

    // Their own artwork lands in P4B; until then they draw the family's neutral
    // scene rather than a stale placeholder from a different visual language.
    case "asama":
    case "yks_alan":
    case "zorluk":
    case "hoca_yaklasimi":
    case "butce":
    case "kontrol":
      return createElement(PendingIllustration, { compact });

    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

/** The steps still drawing the neutral scene, so a test can assert P4A's own scope. */
export const PENDING_STEPS: readonly HocaBulStepId[] = [
  "asama",
  "yks_alan",
  "zorluk",
  "hoca_yaklasimi",
  "butce",
  "kontrol",
];
