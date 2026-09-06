"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { fetchBookings } from "@/lib/lessonsApi";
import { fetchTutorPackagePurchases } from "@/lib/paymentsApi";
import { getStudentRoster } from "@/lib/tutorClassroom";

export function useTutorClassroom() {
  const { isAuthenticated, user } = useAuth();
  const profile = useQuery({ queryKey: ["tutor-me"], queryFn: fetchMyTutorProfile, enabled: isAuthenticated });
  const enabled = isAuthenticated && Boolean(profile.data?.is_verified);
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: fetchBookings, enabled, refetchInterval: 60_000 });
  const packages = useQuery({ queryKey: ["tutor-package-purchases"], queryFn: fetchTutorPackagePurchases, enabled });
  return {
    user, profile, bookings, packages,
    roster: getStudentRoster(bookings.data ?? [], packages.data ?? [], profile.data?.id ?? ""),
    isLoading: profile.isPending || (enabled && bookings.isPending),
    isError: profile.isError || bookings.isError,
    retry: () => { void profile.refetch(); if (enabled) void bookings.refetch(); },
  };
}
