import { HocaBulResults } from "@/components/hoca-bul/HocaBulResults";
import { RouteGuard } from "@/components/shared/RouteGuard";

export const metadata = {
  title: "Sana uygun hocalar | Hocam",
};

export default function HocaBulResultsPage() {
  return (
    <RouteGuard
      requireAuth
      requireRole="student"
      redirectTo="/login?role=student&returnUrl=%2Fhoca-bul%2Fsonuclar"
    >
      <HocaBulResults />
    </RouteGuard>
  );
}
