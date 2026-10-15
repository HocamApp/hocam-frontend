import Image from "next/image";
import { CalendarCheck } from "@phosphor-icons/react";

import { YS_CAMPUS_ITEMS } from "./ysCampusGallery";
import { hero } from "./ysHomeCopy";
import { MAX_TUTOR_YKS_RANK, TRIAL_MINUTES } from "./ysHomeFacts";

const [MAIN, SECOND] = YS_CAMPUS_ITEMS;
const STICKER = hero.sticker(MAX_TUTOR_YKS_RANK);

/**
 * The brand v3 hero picture (docs/design/brand-v3/PLAN.md, T1.1), in place of
 * the campus ring while NEXT_PUBLIC_BRAND_V3 is on.
 *
 * One box with a fixed aspect ratio, everything inside it placed in
 * percentages of that box, so a phone gets the desktop composition scaled
 * down rather than a different arrangement. Nothing reaches above the box:
 * on a phone it stacks under the headline, and a sticker or card poking
 * upwards would sit on the text.
 *
 * The hero is the one section allowed black, pink and yellow together
 * (BRAND.md §3 rule 2): the yellow block and sticker here, the pink button
 * and the highlighted word beside it.
 */
export function YsHeroCollage() {
  return (
    <div className="relative mx-auto aspect-[23/26] w-full max-w-[480px]" data-testid="ys-hero-collage">
      {/* The yellow block behind the main photo, turned so its corner shows. */}
      <div aria-hidden className="absolute bottom-[8%] left-[6%] right-0 top-[5%] rotate-3 rounded-[32px] bg-yellow" />

      <div className="absolute bottom-[8%] left-[6%] right-0 top-[5%] overflow-hidden rounded-[32px] border-[3px] border-ink">
        <Image
          src={MAIN.image}
          alt={MAIN.alt}
          fill
          priority
          sizes="(min-width: 1024px) 480px, 92vw"
          className="object-cover"
          style={{ objectPosition: MAIN.objectPosition ?? "center" }}
        />
      </div>

      <div className="absolute left-0 top-0 aspect-[6/5] w-[38%] -rotate-[5deg] overflow-hidden rounded-[22px] border-[3px] border-white shadow-float">
        <Image
          src={SECOND.image}
          alt={SECOND.alt}
          fill
          sizes="(min-width: 1024px) 180px, 36vw"
          className="object-cover"
          style={{ objectPosition: SECOND.objectPosition ?? "center" }}
        />
      </div>

      {/* Black on yellow in both themes: --on-accent, not --ink. */}
      <div className="absolute right-[4%] top-0 flex size-24 rotate-[10deg] flex-col items-center justify-center rounded-pill border-[3px] border-on-accent bg-yellow text-center text-on-accent sm:size-28">
        <span className="text-[11px] font-semibold leading-tight sm:text-xs">{STICKER.top}</span>
        <span className="text-[19px] font-extrabold leading-tight sm:text-[22px]">
          {STICKER.rank}
        </span>
        <span className="text-[11px] font-semibold leading-tight sm:text-xs">{STICKER.bottom}</span>
      </div>

      {/* D3: generic, no name and no photo, so an icon stands where the
          mockup has an avatar. It illustrates the product; it is not a live
          notification, so it is not announced as one. */}
      <div className="absolute bottom-0 left-0 flex w-[300px] max-w-[86%] items-center gap-3 rounded-[18px] bg-surface px-4 py-3.5 shadow-float sm:-left-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-pink-soft text-ink">
          <CalendarCheck className="size-5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold text-ink">{hero.notice.title}</span>
          <span className="text-xs text-ink-mid">{hero.notice.line(TRIAL_MINUTES)}</span>
        </span>
        <span aria-hidden className="ml-auto size-2.5 shrink-0 rounded-pill bg-pink" />
      </div>
    </div>
  );
}
