import api from "./api";
import type { PlaceLessonsRequest, PlaceLessonsResult } from "@/types";

/** A refusal of the placing call, in the shape the server answers with. */
export class PlaceLessonsFailure extends Error {
  constructor(
    public readonly code: string,
    public readonly detail: string,
    /** "YYYY-MM-DD" of the first lesson that cannot be placed, when the server says. */
    public readonly date: string | null = null,
    public readonly status: number | null = null
  ) {
    super(detail || code);
    this.name = "PlaceLessonsFailure";
  }
}

export async function placeLessons(
  purchaseId: string,
  body: PlaceLessonsRequest
): Promise<PlaceLessonsResult> {
  try {
    const response = await api.post<PlaceLessonsResult>(
      `/payments/package-purchases/${purchaseId}/place-lessons/`,
      body
    );
    return response.data;
  } catch (err) {
    const response = (err as { response?: { status?: number; data?: Record<string, unknown> } })
      ?.response;
    const data = response?.data;
    if (data && typeof data.code === "string") {
      const date =
        (typeof data.unavailable_date === "string" && data.unavailable_date) ||
        (typeof data.taken_date === "string" && data.taken_date) ||
        null;
      throw new PlaceLessonsFailure(
        data.code,
        typeof data.detail === "string" ? data.detail : "",
        date,
        response?.status ?? null
      );
    }
    throw err;
  }
}
