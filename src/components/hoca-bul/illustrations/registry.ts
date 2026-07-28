import { createElement, type ReactElement } from "react";

import { AsamaIllustration } from "./AsamaIllustration";
import { ButceIllustration } from "./ButceIllustration";
import { DerslerIllustration } from "./DerslerIllustration";
import { HedefIllustration } from "./HedefIllustration";
import { HocaYaklasimiIllustration } from "./HocaYaklasimiIllustration";
import { KontrolIllustration } from "./KontrolIllustration";
import { UygunZamanlarIllustration } from "./UygunZamanlarIllustration";
import { YksAlanIllustration } from "./YksAlanIllustration";
import { ZorlukIllustration } from "./ZorlukIllustration";
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
    case "asama":
      return createElement(AsamaIllustration, { state, compact, reduced });
    case "yks_alan":
      return createElement(YksAlanIllustration, { state, compact, reduced });
    case "dersler":
      return createElement(DerslerIllustration, { state, compact, reduced });
    case "zorluk":
      return createElement(ZorlukIllustration, { state, compact, reduced });
    case "hoca_yaklasimi":
      return createElement(HocaYaklasimiIllustration, { state, compact, reduced });
    case "uygun_zamanlar":
      return createElement(UygunZamanlarIllustration, { state, compact, reduced });
    case "butce":
      return createElement(ButceIllustration, { state, compact, reduced });
    case "kontrol":
      return createElement(KontrolIllustration, { state, compact, reduced });

    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}
