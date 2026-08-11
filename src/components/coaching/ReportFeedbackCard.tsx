"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COACHING_FAZ6_QUERY_KEYS,
  REPORT_FEEDBACK_CHOICES,
  REPORT_FEEDBACK_LABELS,
  extractCoachingErrorMessage,
  submitCoachingReportFeedback,
  type CoachingReportFeedbackChoice,
} from "@/lib/coachingApi";

/**
 * Master Spec §22.9 "Öğrenci geri bildirimi" — decision #53. One fixed
 * short choice, not a comment thread; feeds the tutor's next-session
 * prepare screen (see previous_report_feedback there).
 */
export function ReportFeedbackCard({
  reportId,
  currentChoice,
}: {
  reportId: string;
  currentChoice?: CoachingReportFeedbackChoice | null;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<CoachingReportFeedbackChoice | null>(currentChoice ?? null);

  const mutation = useMutation({
    mutationFn: (choice: CoachingReportFeedbackChoice) => submitCoachingReportFeedback(reportId, choice),
    onSuccess: (result) => {
      setSelected(result.choice);
      toast.success("Geri bildirimin kaydedildi.");
      queryClient.invalidateQueries({ queryKey: COACHING_FAZ6_QUERY_KEYS.publishedReport(reportId) });
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kısa geri bildirim</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {REPORT_FEEDBACK_CHOICES.map((choice) => (
          <Button
            key={choice}
            type="button"
            size="sm"
            variant={selected === choice ? "default" : "outline"}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(choice)}
          >
            {REPORT_FEEDBACK_LABELS[choice]}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
