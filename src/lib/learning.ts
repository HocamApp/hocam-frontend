import {
  Atom,
  AudioWaveform,
  BookOpen,
  BookOpenText,
  Briefcase,
  Calculator,
  Dna,
  FlaskConical,
  FunctionSquare,
  Globe2,
  GraduationCap,
  Grid3x3,
  Landmark,
  Languages,
  Puzzle,
  Shapes,
  Sigma,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type {
  LearningGoalTemplate,
  LearningLevel,
  NextLearningMilestone,
  StudentGoal,
  StudentGoalStatus,
  StudentMilestone,
  StudentMilestoneStatus,
} from "@/types";

export function formatLevel(level: LearningLevel) {
  const labels: Record<LearningLevel, string> = {
    beginner: "Başlangıç",
    intermediate: "Orta",
    advanced: "İleri",
  };

  return labels[level] ?? level;
}

export function formatMilestoneStatus(status: StudentMilestoneStatus) {
  const labels: Record<StudentMilestoneStatus, string> = {
    not_started: "Başlamadı",
    planned: "Planlandı",
    in_progress: "Devam ediyor",
    pending_confirmation: "Onay bekliyor",
    completed: "Tamamlandı",
  };

  return labels[status] ?? status;
}

export function formatGoalStatus(status: StudentGoalStatus) {
  const labels: Record<StudentGoalStatus, string> = {
    active: "Aktif",
    completed: "Tamamlandı",
    paused: "Duraklatıldı",
    archived: "Arşivlendi",
  };

  return labels[status] ?? status;
}

export function buildTutorSearchHref(item: NextLearningMilestone) {
  return buildMilestoneTutorSearchHref(
    item.cta.query.learning_goal_id,
    item.cta.query.learning_milestone_id,
    item.cta.query.learning_topic_id
  );
}

export function buildMilestoneTutorSearchHref(
  goalId: string,
  milestoneId: string,
  topicId?: string | null
) {
  const params = new URLSearchParams({
    learning_goal_id: goalId,
    learning_milestone_id: milestoneId,
  });

  if (topicId) {
    params.set("learning_topic_id", topicId);
  }

  return `/tutors?${params.toString()}`;
}

export function goalPackageHref(id: string) {
  return `/dashboard/student/hedefler/${id}`;
}

/** Total tutor-confirmed lessons a package expects across its milestones. */
export function getPackageLessonCount(template: LearningGoalTemplate) {
  return template.milestone_templates.reduce(
    (sum, milestone) => sum + (milestone.required_confirmed_lessons || 0),
    0
  );
}

export function getGoalLessonCount(goal: StudentGoal) {
  return goal.milestones.reduce(
    (sum, milestone) => sum + (milestone.required_confirmed_lessons || 0),
    0
  );
}

export interface PackageCoverTheme {
  gradient: string;
  Icon: LucideIcon;
}

const EXAM_GRADIENTS: Record<string, string> = {
  TYT: "from-sky-500 via-blue-600 to-indigo-600",
  AYT: "from-violet-500 via-purple-600 to-fuchsia-600",
  LGS: "from-teal-500 via-emerald-600 to-green-600",
  KPSS: "from-amber-500 via-orange-500 to-orange-600",
  YKS: "from-rose-500 via-pink-600 to-fuchsia-600",
  DGS: "from-cyan-500 via-sky-600 to-blue-600",
};

const SUBJECT_ICONS: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /matematik|geometri/i, icon: Sigma },
  { match: /fizik/i, icon: Atom },
  { match: /kimya/i, icon: FlaskConical },
  { match: /biyoloji|fen/i, icon: Dna },
  { match: /türkçe|edebiyat/i, icon: BookOpen },
  { match: /tarih/i, icon: Landmark },
  { match: /coğrafya/i, icon: Globe2 },
  { match: /ingilizce|almanca|dil/i, icon: Languages },
];

export function getPackageCoverTheme(
  examType?: string | null,
  subjectName?: string | null
): PackageCoverTheme {
  const gradient =
    (examType && EXAM_GRADIENTS[examType.toUpperCase()]) ||
    "from-slate-500 via-slate-600 to-slate-700";
  const Icon =
    SUBJECT_ICONS.find(({ match }) => subjectName && match.test(subjectName))
      ?.icon ?? GraduationCap;

  return { gradient, Icon };
}

export type CoverPattern =
  | "dots"
  | "grid"
  | "waves"
  | "curve"
  | "rings"
  | "diagonal";

export interface PackageCoverDecoration {
  Icon: LucideIcon;
  pattern: CoverPattern;
}

/** Topic-specific cover art hints, matched against the package slug. */
const COVER_DECORATIONS: Array<{
  match: RegExp;
  icon: LucideIcon;
  pattern: CoverPattern;
}> = [
  { match: /integral/, icon: Sigma, pattern: "curve" },
  { match: /turev|limit/, icon: TrendingUp, pattern: "curve" },
  { match: /trigonometri/, icon: AudioWaveform, pattern: "waves" },
  { match: /geometri/, icon: Shapes, pattern: "diagonal" },
  { match: /fonksiyon|polinom/, icon: FunctionSquare, pattern: "curve" },
  { match: /problem/, icon: Puzzle, pattern: "grid" },
  { match: /deneme|strateji|analiz|mentorluk/, icon: Target, pattern: "rings" },
  { match: /paragraf|turkce/, icon: BookOpenText, pattern: "dots" },
  { match: /kpss/, icon: Briefcase, pattern: "diagonal" },
  { match: /dgs/, icon: Calculator, pattern: "diagonal" },
  { match: /temel|baslangic/, icon: Grid3x3, pattern: "grid" },
];

export function getPackageCoverDecoration(
  slug?: string | null,
  subjectName?: string | null
): PackageCoverDecoration {
  const hit = COVER_DECORATIONS.find(({ match }) => slug && match.test(slug));
  if (hit) return { Icon: hit.icon, pattern: hit.pattern };

  const Icon =
    SUBJECT_ICONS.find(({ match }) => subjectName && match.test(subjectName))
      ?.icon ?? GraduationCap;
  return { Icon, pattern: "dots" };
}

export type MilestonePathNodeKind = "start" | "milestone" | "reward";

export type MilestonePathNodeState =
  | "completed"
  | "active"
  | "pending_confirmation"
  | "upcoming"
  | "reward_locked"
  | "reward_unlocked";

export interface MilestonePathNode {
  id: string;
  kind: MilestonePathNodeKind;
  state: MilestonePathNodeState;
  title: string;
  description: string;
  progress: number;
  requiredLessons: number;
  /** Set only for real milestones of an active goal — powers the tutor-search CTA. */
  cta: { goalId: string; milestoneId: string; topicId: string | null } | null;
}

export interface MilestonePathSection {
  label: string;
  nodes: MilestonePathNode[];
}

function isMilestoneCompleted(milestone: StudentMilestone) {
  return milestone.status === "completed" || milestone.progress >= 100;
}

/**
 * Builds the Duolingo-style road for a package.
 *
 * The synthetic "start" node maps to a real, trackable action (the goal
 * exists) and the final reward node is a celebration checkpoint — the
 * backend has no reward system, so it never promises a concrete prize.
 * "Locked" later nodes are a visual reading order only; the backend does
 * not enforce sequential completion.
 */
export function buildMilestonePath(
  template: LearningGoalTemplate | null,
  goal: StudentGoal | null
): MilestonePathNode[] {
  const nodes: MilestonePathNode[] = [];
  const goalActive = goal !== null;

  nodes.push({
    id: "start",
    kind: "start",
    state: goalActive ? "completed" : "active",
    title: "Hedefi aktif et",
    description: goalActive
      ? "Bu paketi hedeflerine ekledin. Yol açıldı!"
      : "Paketi hedeflerine ekle ve yolculuğu başlat.",
    progress: goalActive ? 100 : 0,
    requiredLessons: 0,
    cta: null,
  });

  if (goal) {
    const milestones = [...goal.milestones].sort((a, b) => a.order - b.order);
    const currentIndex = milestones.findIndex((m) => !isMilestoneCompleted(m));

    milestones.forEach((milestone, index) => {
      let state: MilestonePathNodeState;
      if (isMilestoneCompleted(milestone)) {
        state = "completed";
      } else if (milestone.status === "pending_confirmation") {
        state = "pending_confirmation";
      } else if (index === currentIndex) {
        state = "active";
      } else {
        state = "upcoming";
      }

      nodes.push({
        id: milestone.id,
        kind: "milestone",
        state,
        title: milestone.title,
        description: milestone.description,
        progress: milestone.progress,
        requiredLessons: milestone.required_confirmed_lessons,
        cta: {
          goalId: goal.id,
          milestoneId: milestone.id,
          topicId: milestone.topic,
        },
      });
    });

    const allCompleted =
      milestones.length > 0 && milestones.every(isMilestoneCompleted);

    nodes.push({
      id: "reward",
      kind: "reward",
      state: allCompleted ? "reward_unlocked" : "reward_locked",
      title: "Ödül sandığı",
      description: allCompleted
        ? "Tüm aşamaları tamamladın. Harika bir iş çıkardın!"
        : "Tüm aşamaları tamamladığında sandık açılır.",
      progress: allCompleted ? 100 : 0,
      requiredLessons: 0,
      cta: null,
    });

    return nodes;
  }

  if (template) {
    const milestoneTemplates = [...template.milestone_templates].sort(
      (a, b) => a.order - b.order
    );

    milestoneTemplates.forEach((milestone) => {
      nodes.push({
        id: milestone.id,
        kind: "milestone",
        state: "upcoming",
        title: milestone.title,
        description: milestone.description,
        progress: 0,
        requiredLessons: milestone.required_confirmed_lessons,
        cta: null,
      });
    });

    nodes.push({
      id: "reward",
      kind: "reward",
      state: "reward_locked",
      title: "Ödül sandığı",
      description: "Tüm aşamaları tamamladığında sandık açılır.",
      progress: 0,
      requiredLessons: 0,
      cta: null,
    });
  }

  return nodes;
}

/** Splits the road into labelled sections of at most `chunkSize` nodes. */
export function splitPathIntoSections(
  nodes: MilestonePathNode[],
  chunkSize = 4
): MilestonePathSection[] {
  if (nodes.length === 0) return [];

  const sections: MilestonePathSection[] = [];
  for (let i = 0; i < nodes.length; i += chunkSize) {
    sections.push({ label: "", nodes: nodes.slice(i, i + chunkSize) });
  }

  sections.forEach((section, index) => {
    if (sections.length === 1) {
      section.label = "Yol haritası";
    } else if (index === sections.length - 1) {
      section.label = "Final";
    } else {
      section.label = `${index + 1}. Bölüm`;
    }
  });

  return sections;
}

/** First not-yet-completed milestone of a goal, in display order. */
export function getNextMilestone(goal: StudentGoal): StudentMilestone | null {
  const milestones = [...goal.milestones].sort((a, b) => a.order - b.order);
  return milestones.find((m) => !isMilestoneCompleted(m)) ?? null;
}
