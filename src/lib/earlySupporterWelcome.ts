import type { Notification } from "@/types/api";

export const EARLY_SUPPORTER_WELCOME_TYPE = "early_supporter_welcome";

export function findUnreadEarlySupporterWelcome(
  notifications: Notification[] | undefined
): Notification | undefined {
  return notifications?.find(
    (notification) =>
      notification.type === EARLY_SUPPORTER_WELCOME_TYPE &&
      !notification.is_read
  );
}
