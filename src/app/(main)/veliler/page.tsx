import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { PublicSeoBreadcrumbs } from "@/components/seo/PublicSeoPage";
import { YsGuarantees } from "@/components/yemeksepeti/YsGuarantees";
import { YsHomeFaq } from "@/components/yemeksepeti/YsHomeFaq";
import { pages } from "@/components/yemeksepeti/ysHomeCopy";
import { YsParentsPanel } from "@/components/yemeksepeti/YsParentsPanel";
import { HOME_V2_ENABLED } from "@/lib/featureFlags";
import { breadcrumbJsonLd, publicPageMetadata, publicWebPageJsonLd } from "@/lib/publicSeo";

const path = "/veliler" as const;
const copy = pages.veliler;
const breadcrumbs = [
  { label: pages.homeBreadcrumb, href: "/" },
  { label: copy.breadcrumb, href: path },
] as const;

/* Part of the rebuilt homepage: with NEXT_PUBLIC_HOME_V2 off this route is a
   404 and stays out of the index. */
export const metadata: Metadata = HOME_V2_ENABLED
  ? publicPageMetadata({ title: copy.title, description: copy.description, path })
  : { robots: { index: false, follow: false } };

/**
 * Everything a parent asks (plan T14): the homepage's parents panel, what
 * happens when something goes wrong, and the Veli tab of the FAQ.
 */
export default function ParentsPage() {
  if (!HOME_V2_ENABLED) notFound();

  return (
    <>
      <JsonLd
        data={[
          publicWebPageJsonLd({ path, name: copy.title, description: copy.description }),
          breadcrumbJsonLd(breadcrumbs),
        ]}
      />
      {/* pt on the wrapper: `.ys-shell` overrides its own padding. */}
      <div className="pt-6">
        <div className="ys-shell">
          <PublicSeoBreadcrumbs items={breadcrumbs} />
        </div>
      </div>
      <YsParentsPanel className="mt-6" showCta={false} />
      <YsGuarantees />
      <div className="ys-shell">
        <YsHomeFaq v2 audiences={["parent"]} guideHref="/#ogrenciler" />
      </div>
    </>
  );
}
