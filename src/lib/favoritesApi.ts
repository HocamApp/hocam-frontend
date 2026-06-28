import api from "./api";
import type { FavoriteTutor } from "@/types/api";

export async function fetchFavoriteTutors(): Promise<FavoriteTutor[]> {
  const { data } = await api.get<FavoriteTutor[]>("/favorites/tutors/");
  return data;
}

export async function addFavoriteTutor(tutorId: string): Promise<FavoriteTutor> {
  const { data } = await api.post<FavoriteTutor>("/favorites/tutors/", { tutor: tutorId });
  return data;
}

export async function removeFavoriteTutor(tutorId: string): Promise<void> {
  await api.delete(`/favorites/tutors/${tutorId}/`);
}
