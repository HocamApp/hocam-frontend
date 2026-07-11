"use client";

import { Suspense } from "react";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { QuestionLibrary } from "@/components/questions/QuestionLibrary";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function QuestionsPage() {
  return (
    <RouteGuard requireAuth>
      <Suspense fallback={<div className="p-12"><LoadingSpinner /></div>}>
        <QuestionLibrary />
      </Suspense>
    </RouteGuard>
  );
}
