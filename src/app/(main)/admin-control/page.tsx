"use client";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { AdminOperationsConsole } from "@/components/admin/AdminOperationsConsole";

export default function AdminControlPage() {
  return (
    <RouteGuard requireAdmin>
      <AdminOperationsConsole />
    </RouteGuard>
  );
}
