import { Suspense } from "react";

import { HocaBulWizard } from "@/components/hoca-bul/HocaBulWizard";
import { WizardBootSkeleton } from "@/components/hoca-bul/WizardOptionsSkeleton";
import { RouteGuard } from "@/components/shared/RouteGuard";

export const metadata = {
  title: "Sana uygun hocayı bulalım | Hocam",
};

export default function HocaBulPage() {
  return (
    <RouteGuard
      requireAuth
      requireRole="student"
      redirectTo="/login?role=student&returnUrl=%2Fhoca-bul"
    >
      {/* useSearchParams needs a Suspense boundary to keep the route static. */}
      <Suspense fallback={<WizardBootSkeleton />}>
        <HocaBulWizard />
      </Suspense>
    </RouteGuard>
  );
}
