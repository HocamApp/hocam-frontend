"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchTutorCoachingRescheduleRequests,
  fetchTutorCoachingTimeRequests,
} from "@/lib/coachingApi";

/**
 * Time requests (48h to answer) and reschedule requests (must be answered
 * before the meeting) that are waiting for the tutor. They used to be two
 * small underlined links on the students page with no count.
 */
export function useTutorCoachingPendingWork() {
  const timeRequests = useQuery({
    queryKey: ["coaching-tutor-time-requests"],
    queryFn: fetchTutorCoachingTimeRequests,
    staleTime: 60_000,
  });
  const rescheduleRequests = useQuery({
    queryKey: ["coaching-tutor-reschedule-requests"],
    queryFn: fetchTutorCoachingRescheduleRequests,
    staleTime: 60_000,
  });
  const time = timeRequests.data?.filter((r) => r.status === "pending").length ?? 0;
  const reschedule =
    rescheduleRequests.data?.filter((r) => r.status === "pending").length ?? 0;
  return { time, reschedule, total: time + reschedule };
}
