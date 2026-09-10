/**
 * The ready-made avatars a student can pick instead of uploading a photo.
 *
 * This list only drives the picker UI. The avatar a student is actually
 * wearing comes back from the API as `avatar_url`, resolved server-side from
 * `ANONYMOUS_AVATAR_PRESETS` in `apps/students/serializers.py` — so the keys
 * here and there have to stay in step. A backend test asserts each key maps
 * to `/avatars/<key>.png`.
 *
 * The files are ours, under `public/avatars/`. They replaced externally
 * hosted dicebear drawings: self-hosting means the avatars survive that
 * service changing or disappearing, and no student's profile picture is a
 * request to a third party.
 *
 * No labels. The keys are the filenames the illustrations ship with and stay
 * internal — a student is choosing a picture, not a character, and the name
 * under their avatar should be the one they typed into their own profile.
 * The picker names each option by position for screen readers instead.
 */
export const STUDENT_AVATAR_PRESETS = [
  { key: "hanna", url: "/avatars/hanna.png" },
  { key: "lars", url: "/avatars/lars.png" },
  { key: "raul", url: "/avatars/raul.png" },
  { key: "reana", url: "/avatars/reana.png" },
  { key: "saskia", url: "/avatars/saskia.png" },
  { key: "theo", url: "/avatars/theo.png" },
] as const;

export type StudentAvatarKey = (typeof STUDENT_AVATAR_PRESETS)[number]["key"];
