import type { TutorPackageOffer, UpdateTutorPackageOfferPayload } from "@/types";

export interface DraftOffer {
  is_offered: boolean;
  discount_percent: number | null;
}

export function draftsFromOffers(offers: TutorPackageOffer[]): Record<string, DraftOffer> {
  return Object.fromEntries(
    offers.map((o) => [
      o.plan_id,
      { is_offered: o.is_offered, discount_percent: o.discount_percent },
    ])
  );
}

/**
 * Only plans whose draft actually differs from what the server returned
 * belong in a PATCH /api/payments/tutor/package-offers/ payload. The
 * backend upserts a TutorPackageOffer row for every item it receives,
 * whether or not the values are a no-op — it has no way to tell "the tutor
 * explicitly chose the default" from "nothing changed." Sending all 20
 * catalog plans on every save would create a row for every one of them,
 * defeating the sparse-storage design (a missing row means "offered at
 * catalog discount" — see TutorPackageOffer's docstring in
 * apps/payments/models.py). This is the only thing standing between the
 * frontend and that outcome, so it's covered by tutorPackageOffers.test.ts.
 */
export function computeChangedOffers(
  offers: TutorPackageOffer[],
  drafts: Record<string, DraftOffer>
): UpdateTutorPackageOfferPayload[] {
  const changed: UpdateTutorPackageOfferPayload[] = [];
  for (const offer of offers) {
    const draft = drafts[offer.plan_id];
    if (!draft) continue;
    if (
      draft.is_offered !== offer.is_offered ||
      draft.discount_percent !== offer.discount_percent
    ) {
      changed.push({
        plan_id: offer.plan_id,
        is_offered: draft.is_offered,
        discount_percent: draft.discount_percent,
      });
    }
  }
  return changed;
}
