"use client";

import { Suspense } from "react";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { QuestionLibrary } from "@/components/questions/QuestionLibrary";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function WrongQuestionsPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <Suspense fallback={<div className="p-12"><LoadingSpinner /></div>}>
        <QuestionLibrary wrongOnly />
      </Suspense>
    </RouteGuard>
  );
}
