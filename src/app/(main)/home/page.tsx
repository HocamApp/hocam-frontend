import { RoleAwareHome } from "@/components/home/RoleAwareHome";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function AuthenticatedHomePage() {
  return (
    <RouteGuard requireAuth>
      <RoleAwareHome />
    </RouteGuard>
  );
}
