/**
 * Faz 5 — coaching-room copy, extracted so the money-honesty invariant
 * (never "iade edildi", no real refund/payment claim — no provider is
 * connected) can be locked by a test instead of only living inline in a
 * page component.
 */
export const NO_SHOW_RIGHT_PRESERVED_COPY =
  "Öğretmen gelmezse bu görüşme hakkın korunur.";

export const NO_SHOW_CONSUMED_COPY =
  "Öğrenci gelmezse bu görüşme hakkı kullanılmış sayılır.";

export const NO_SHOW_PARTY_LABEL: Record<"student" | "tutor", string> = {
  student: "Öğrenci gelmedi",
  tutor: "Öğretmen gelmedi",
};
