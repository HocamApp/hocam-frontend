export const MATCH_MOTION = {
  press: 0.08,
  hover: 0.12,
  select: 0.16,
  message: 0.18,
  reveal: 0.22,
  stepExit: 0.14,
  stepEnter: 0.22,
  progress: 0.28,
  scene: 0.3,
  layout: 0.26,
  resultCard: 0.26,
  complete: 0.65,
} as const;

export const MATCH_EASING = {
  interaction: [0.2, 0, 0, 1] as const,
  enter: [0.16, 1, 0.3, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  complete: [0.65, 0, 0.35, 1] as const,
} as const;
