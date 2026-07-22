export type LessonQuestionInvitationDisposition = "accepted" | "dismissed";

export interface LessonQuestionInvitationState {
  handledVersion: number | null;
  modalOpen: boolean;
  panelOpen: boolean;
}

export interface LessonQuestionInvitationStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const initialLessonQuestionInvitationState: LessonQuestionInvitationState = {
  handledVersion: null,
  modalOpen: false,
  panelOpen: false,
};

export function getLessonQuestionInvitationStorageKey(
  bookingId: string,
  version: number
) {
  return `hocam:lesson-question:${bookingId}:${version}`;
}

export function readLessonQuestionInvitationDisposition(
  storage: LessonQuestionInvitationStorage,
  bookingId: string,
  version: number
): LessonQuestionInvitationDisposition | null {
  try {
    const value = storage.getItem(
      getLessonQuestionInvitationStorageKey(bookingId, version)
    );
    return value === "accepted" || value === "dismissed" ? value : null;
  } catch {
    return null;
  }
}

export function writeLessonQuestionInvitationDisposition(
  storage: LessonQuestionInvitationStorage,
  bookingId: string,
  version: number,
  disposition: LessonQuestionInvitationDisposition
) {
  try {
    storage.setItem(
      getLessonQuestionInvitationStorageKey(bookingId, version),
      disposition
    );
  } catch {
    // Storage may be unavailable in privacy-restricted browsers. The in-memory
    // state still prevents repeated invitations until the page is reloaded.
  }
}

export function syncLessonQuestionInvitation(
  current: LessonQuestionInvitationState,
  input: {
    activeQuestionId: string | null;
    version: number;
    storedDisposition: LessonQuestionInvitationDisposition | null;
  }
): LessonQuestionInvitationState {
  if (!input.activeQuestionId) {
    return initialLessonQuestionInvitationState;
  }
  if (current.handledVersion === input.version) {
    return current;
  }
  if (input.storedDisposition === "accepted") {
    return {
      handledVersion: input.version,
      modalOpen: false,
      panelOpen: true,
    };
  }
  if (input.storedDisposition === "dismissed") {
    return {
      handledVersion: input.version,
      modalOpen: false,
      panelOpen: false,
    };
  }
  return {
    handledVersion: input.version,
    modalOpen: true,
    panelOpen: false,
  };
}

export function acceptLessonQuestionInvitation(
  current: LessonQuestionInvitationState,
  version: number
): LessonQuestionInvitationState {
  return {
    ...current,
    handledVersion: version,
    modalOpen: false,
    panelOpen: true,
  };
}

export function dismissLessonQuestionInvitation(
  current: LessonQuestionInvitationState,
  version: number
): LessonQuestionInvitationState {
  return {
    ...current,
    handledVersion: version,
    modalOpen: false,
    panelOpen: false,
  };
}
