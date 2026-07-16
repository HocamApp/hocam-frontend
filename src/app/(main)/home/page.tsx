import { AuthenticatedHome } from "@/components/home/AuthenticatedHome";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function AuthenticatedHomePage() {
  return (
    <RouteGuard requireRole="student">
      <AuthenticatedHome />
    </RouteGuard>
  );
}
