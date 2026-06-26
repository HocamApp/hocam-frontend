"use client";

import { useEffect } from "react";
import { sendPresenceHeartbeat } from "@/lib/authApi";
import { useAuth } from "@/hooks/useAuth";

const HEARTBEAT_INTERVAL_MS = 30_000;

export function PresenceHeartbeat() {
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const ping = async () => {
      try {
        await sendPresenceHeartbeat();
      } catch {
        // Presence should never interrupt the user experience.
      }
    };

    ping();
    const intervalId = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, token]);

  return null;
}
