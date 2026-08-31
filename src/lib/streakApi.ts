import api from "./api";

export interface StudentStreak {
  length: number;
  longest: number;
  active_today: boolean;
  freezes_left: number;
  frozen_dates: string[];
  last_active_date: string | null;
}

export async function fetchStudentStreak(): Promise<StudentStreak> {
  const response = await api.get<StudentStreak>("/profile/streak/");
  return response.data;
}
