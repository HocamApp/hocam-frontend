"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { BookingModal } from "@/components/lessons/BookingModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { recordDiscoveryEvent } from "@/lib/discovery";
import {
  prepareTrialBooking,
  trialBookingUnavailableCopy,
  type TrialBookingUnavailableReason,
} from "@/lib/trialBookingAvailability";
import { fetchTutorById } from "@/lib/tutorsApi";
import type { TutorProfile } from "@/types";

type LearningContextQuery = {
  learning_goal_id: string;
  learning_milestone_id: string;
  learning_topic_id?: string | null;
};

export function useTutorTrialBookingLauncher(discoveryImpressionId?: string | null) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isStudent, user, isLoading: authLoading } = useAuth();
  const [trialTutor, setTrialTutor] = useState<TutorProfile | null>(null);
  const [pendingTutorId, setPendingTutorId] = useState<string | null>(null);
  const [unavailableReason, setUnavailableReason] =
    useState<TrialBookingUnavailableReason | null>(null);

  const startTrial = useCallback(
    async (selectedTutor: TutorProfile) => {
      if (authLoading || pendingTutorId) return;

      setPendingTutorId(selectedTutor.id);
      setUnavailableReason(null);
      try {
        const preparation = await prepareTrialBooking(
          selectedTutor.id,
          {
            isAuthenticated,
            isStudent,
            userId: user?.id ?? null,
          },
          fetchTutorById,
        );

        if (preparation.status === "eligible") {
          queryClient.setQueryData(["tutor", selectedTutor.id], preparation.tutor);
          if (discoveryImpressionId) {
            void recordDiscoveryEvent(
              discoveryImpressionId,
              selectedTutor.id,
              "booking_started",
            );
          }
          setTrialTutor(preparation.tutor);
        } else {
          setUnavailableReason(preparation.reason);
        }
      } catch {
        setUnavailableReason("unavailable");
      } finally {
        setPendingTutorId(null);
      }
    },
    [
      authLoading,
      discoveryImpressionId,
      isAuthenticated,
      isStudent,
      pendingTutorId,
      queryClient,
      user?.id,
    ],
  );

  return {
    pendingTutorId,
    trialDisabled: authLoading || pendingTutorId !== null,
    startTrial,
    trialTutor,
    unavailableReason,
    closeBooking: () => setTrialTutor(null),
    closeUnavailable: () => setUnavailableReason(null),
    completeBooking: () => {
      if (!trialTutor) return;
      const tutorId = trialTutor.id;
      setTrialTutor(null);
      queryClient.invalidateQueries({ queryKey: ["tutor", tutorId] });
      toast.success("Ücretsiz deneme dersi isteğin gönderildi.");
    },
  };
}

type TrialBookingLauncher = ReturnType<typeof useTutorTrialBookingLauncher>;

export function TutorTrialBookingOverlays({
  launcher,
  learningContext,
  returnUrl,
}: {
  launcher: TrialBookingLauncher;
  learningContext?: LearningContextQuery | null;
  returnUrl: string;
}) {
  const router = useRouter();
  const unavailableCopy = launcher.unavailableReason
    ? trialBookingUnavailableCopy(launcher.unavailableReason)
    : null;

  return (
    <>
      {launcher.trialTutor && (
        <BookingModal
          tutor={launcher.trialTutor}
          isOpen
          isTrial
          learningContext={learningContext}
          onClose={launcher.closeBooking}
          onSuccess={launcher.completeBooking}
        />
      )}

      <Dialog
        open={launcher.unavailableReason !== null}
        onOpenChange={(open) => {
          if (!open) launcher.closeUnavailable();
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] rounded-modal border-line bg-surface sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-paper text-ink">
              <WarningCircle className="h-6 w-6" weight="regular" aria-hidden />
            </span>
            <DialogTitle>{unavailableCopy?.title}</DialogTitle>
            <DialogDescription className="max-w-sm leading-6 text-ink-mid">
              {unavailableCopy?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={launcher.closeUnavailable}>
              Kapat
            </Button>
            {launcher.unavailableReason === "sign_in_required" && (
              <Button
                type="button"
                onClick={() =>
                  router.push(
                    `/login?role=student&returnUrl=${encodeURIComponent(returnUrl)}`,
                  )
                }
              >
                Giriş yap
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
