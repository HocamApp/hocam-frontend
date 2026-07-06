import {
  ClipboardCheck,
  LucideIcon,
  MessageSquare,
  SmilePlus,
  Target,
} from "lucide-react";
import { CriteriaRatingKey } from "@/types";

export interface ReviewCriterion {
  key: CriteriaRatingKey;
  /** Field name on Review objects, e.g. "clarity_rating". */
  field: `${CriteriaRatingKey}_rating`;
  label: string;
  /** Short label for the compact criteria row on review cards. */
  shortLabel: string;
  /** Question shown next to the star input in the review form. */
  question: string;
  icon: LucideIcon;
}

// Order matters: it drives the form rows and the profile criteria cards.
export const REVIEW_CRITERIA: ReviewCriterion[] = [
  {
    key: "clarity",
    field: "clarity_rating",
    label: "Anlatım Netliği",
    shortLabel: "Anlatım",
    question: "Konuyu ne kadar anlaşılır anlattı?",
    icon: MessageSquare,
  },
  {
    key: "preparation",
    field: "preparation_rating",
    label: "Derse Hazırlık",
    shortLabel: "Hazırlık",
    question: "Ders planlı ve verimli miydi?",
    icon: ClipboardCheck,
  },
  {
    key: "progress",
    field: "progress_rating",
    label: "Hedefe İlerleme",
    shortLabel: "İlerleme",
    question: "Ders sonunda hedeflediğin konuda ilerlediğini hissettin mi?",
    icon: Target,
  },
  {
    key: "confidence",
    field: "confidence_rating",
    label: "Güven & Motivasyon",
    shortLabel: "Motivasyon",
    question: "Soru sormak ve derse katılmak ne kadar rahattı?",
    icon: SmilePlus,
  },
];
