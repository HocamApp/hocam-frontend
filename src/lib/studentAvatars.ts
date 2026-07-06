export const STUDENT_AVATAR_PRESETS = [
  {
    key: "cat",
    label: "Kedi",
    url: "https://api.dicebear.com/10.x/thumbs/svg?seed=hocam-cat",
  },
  {
    key: "fox",
    label: "Tilki",
    url: "https://api.dicebear.com/10.x/thumbs/svg?seed=hocam-fox",
  },
  {
    key: "panda",
    label: "Panda",
    url: "https://api.dicebear.com/10.x/thumbs/svg?seed=hocam-panda",
  },
  {
    key: "koala",
    label: "Koala",
    url: "https://api.dicebear.com/10.x/thumbs/svg?seed=hocam-koala",
  },
  {
    key: "rabbit",
    label: "Tavşan",
    url: "https://api.dicebear.com/10.x/thumbs/svg?seed=hocam-rabbit",
  },
  {
    key: "bear",
    label: "Ayı",
    url: "https://api.dicebear.com/10.x/thumbs/svg?seed=hocam-bear",
  },
] as const;

export type StudentAvatarKey = (typeof STUDENT_AVATAR_PRESETS)[number]["key"];
