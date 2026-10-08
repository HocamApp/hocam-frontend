import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { PublicSeoBreadcrumbs } from "@/components/seo/PublicSeoPage";
import { YsHomeFaq } from "@/components/yemeksepeti/YsHomeFaq";
import { pages } from "@/components/yemeksepeti/ysHomeCopy";
import { MAX_TUTOR_YKS_RANK } from "@/components/yemeksepeti/ysHomeFacts";
import { YsTutorBand } from "@/components/yemeksepeti/YsTutorBand";
import { HOME_V2_ENABLED } from "@/lib/featureFlags";
import { breadcrumbJsonLd, publicPageMetadata, publicWebPageJsonLd } from "@/lib/publicSeo";

const path = "/hoca-ol" as const;
const copy = pages.hocaOl;
const description = copy.description(MAX_TUTOR_YKS_RANK);
const breadcrumbs = [
  { label: pages.homeBreadcrumb, href: "/" },
  { label: copy.breadcrumb, href: path },
] as const;

/* Part of the rebuilt homepage: with NEXT_PUBLIC_HOME_V2 off this route is a
   404 and stays out of the index. */
export const metadata: Metadata = HOME_V2_ENABLED
  ? publicPageMetadata({ title: copy.title, description, path })
  : { robots: { index: false, follow: false } };

/**
 * Every "Hoca ol" link on the rebuilt site lands here (plan T13): the
 * homepage's tutors band as the hero, the Hoca tab of the FAQ, then the one
 * step left, registration.
 */
export default function BecomeTutorPage() {
  if (!HOME_V2_ENABLED) notFound();

  return (
    <>
      <JsonLd
        data={[
          publicWebPageJsonLd({ path, name: copy.title, description }),
          breadcrumbJsonLd(breadcrumbs),
        ]}
      />
      {/* pt on the wrapper: `.ys-shell` overrides its own padding. */}
      <div className="pt-6">
        <div className="ys-shell">
          <PublicSeoBreadcrumbs items={breadcrumbs} />
        </div>
      </div>
      <YsTutorBand className="mt-6" />
      <div className="ys-shell">
        <YsHomeFaq v2 audiences={["tutor"]} guideHref="/nasil-calisir" />
        <section
          aria-labelledby="hoca-ol-cta"
          className="mb-8 flex flex-col items-center gap-6 rounded-card bg-pink px-6 py-14 text-center text-white md:py-20"
        >
          <h2 id="hoca-ol-cta" className="text-h1-m font-bold md:text-h1">
            {copy.ctaTitle}
          </h2>
          {/* On pink in both themes: the band's inverted primary. */}
          <Link
            href="/register?role=tutor"
            className="inline-flex h-12 items-center rounded-pill bg-white px-8 text-body font-semibold text-[#02171a] transition-colors duration-[--duration-state] hover:bg-[#f2ecec]"
          >
            {copy.ctaButton}
          </Link>
        </section>
      </div>
    </>
  );
}
