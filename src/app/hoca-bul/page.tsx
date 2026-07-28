import { Suspense } from "react";

import { HocaBulSubmissionController } from "@/components/hoca-bul/HocaBulSubmissionController";
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
        <HocaBulSubmissionController />
      </Suspense>
    </RouteGuard>
  );
}
