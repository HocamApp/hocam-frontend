"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  GraduationCap,
  LoaderCircle,
  Sparkles,
  Target,
} from "lucide-react";

import { MatchResultCard } from "@/components/matching/MatchResultCard";
import { MatchingScene } from "@/components/matching/MatchingScene";
import { MATCH_EASING, MATCH_MOTION } from "@/components/matching/motion";
import { QuestionTransition } from "@/components/matching/QuestionTransition";
import { SelectionCard, SelectionCount } from "@/components/matching/SelectionCard";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { useAuth } from "@/hooks/useAuth";
import { announceInterfaceContentReady } from "@/lib/interfaceLanguage";
import {
  answersForGoal,
  deriveMatchingSceneState,
  hasAnswerForStep,
  selectAvailabilityWindow,
  toggleLimited,
  type MatchPhase,
  type MotionDirection,
} from "@/lib/matchingFlow";
import {
  fetchMatchingOptions,
  previewTutorMatches,
  saveMatchingPreferences,
} from "@/lib/matchingApi";
import {
  MATCHING_DRAFT_KEY,
  createMatchingDraft,
  isCompleteMatchingAnswers,
  parseMatchingDraft,
} from "@/lib/matchingDraft";
import { formatPrice } from "@/lib/utils";
import type {
  MatchAvailabilityWindow,
  MatchBudgetSegment,
  MatchChallenge,
  MatchGoal,
  MatchingAnswers,
  TutorTeachingStyle,
} from "@/types";

const CHALLENGE_OPTIONS: Array<{ value: MatchChallenge; label: string }> = [
  { value: "foundations", label: "Konu temellerimde eksikler var" },
  { value: "question_solving", label: "Konuyu biliyorum ama sorularda zorlanıyorum" },
  { value: "speed_accuracy", label: "Hızımı ve netlerimi artırmak istiyorum" },
  { value: "consistency", label: "Düzenli çalışmakta zorlanıyorum" },
  { value: "where_to_start", label: "Nereden başlayacağımı bilmiyorum" },
  { value: "advanced_questions", label: "Daha ileri seviye sorular çözmek istiyorum" },
];

const STYLE_OPTIONS: Array<{
  value: TutorTeachingStyle;
  label: string;
  detail: string;
}> = [
  { value: "foundations_patient", label: "Sabırla temelden anlatan", detail: "Konuyu adım adım kurar." },
  { value: "question_speed", label: "Bol soru çözen ve hız kazandıran", detail: "Pratik ve sınav temposuna odaklanır." },
  { value: "planning_accountability", label: "Program hazırlayan ve takip eden", detail: "İlerlemeni düzenli takip eder." },
  { value: "motivating_communication", label: "Motive eden, iletişimi güçlü", detail: "Süreç boyunca yanında olur." },
  { value: "high_target", label: "Zorlayıcı ve yüksek hedef odaklı", detail: "Potansiyelini ileri taşımaya odaklanır." },
];

const AVAILABILITY_OPTIONS: Array<{
  value: MatchAvailabilityWindow;
  label: string;
}> = [
  { value: "weekday_day", label: "Hafta içi gündüz" },
  { value: "weekday_evening", label: "Hafta içi akşam" },
  { value: "weekend_day", label: "Hafta sonu gündüz" },
  { value: "weekend_evening", label: "Hafta sonu akşam" },
  { value: "flexible", label: "Programım değişebilir" },
];

const STEP_TITLES = [
  "Hangi hedef için destek arıyorsun?",
  "Şu an hangi aşamadasın?",
  "Hangi derslerde destek istiyorsun?",
  "Şu an seni en çok zorlayan ne?",
  "Nasıl bir hoca sana daha iyi gelir?",
  "Dersleri genellikle ne zaman yapabilirsin?",
  "Ders başına hangi bütçe aralığı sana uygun?",
] as const;

function MatchingExperience() {
  const reducedMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { user, isStudent } = useAuth();
  const [phase, setPhase] = useState<MatchPhase>("intro");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<MotionDirection>(1);
  const [answers, setAnswers] = useState<Partial<MatchingAnswers>>({ schema_version: 1 });
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPreparingOptions, setIsPreparingOptions] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const draftKey = user?.id ? `${MATCHING_DRAFT_KEY}:${user.id}` : null;

  const goal = answers.goal ?? "UNDECIDED";
  const subjectKeys = useMemo(() => answers.subject_keys ?? [], [answers.subject_keys]);
  const matchingOptionsKey = useMemo(
    () => ["matching-options", goal, subjectKeys] as const,
    [goal, subjectKeys]
  );
  const optionsQuery = useQuery({
    queryKey: matchingOptionsKey,
    queryFn: () => fetchMatchingOptions(goal, subjectKeys),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  const saveMutation = useMutation({ mutationFn: saveMatchingPreferences });
  const previewMutation = useMutation({ mutationFn: previewTutorMatches });

  useEffect(() => {
    if (!draftKey) return;
    window.localStorage.removeItem(MATCHING_DRAFT_KEY);
    const draft = parseMatchingDraft(window.localStorage.getItem(draftKey));
    if (draft) {
      setAnswers({ schema_version: 1, ...draft.answers });
      setStep(Math.min(Math.max(draft.step, 0), 6));
      setPhase("questions");
    } else {
      window.localStorage.removeItem(draftKey);
    }
    setDraftLoaded(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftLoaded || !draftKey || phase === "results") return;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify(createMatchingDraft(answers, step))
    );
  }, [answers, draftKey, draftLoaded, phase, step]);

  const options = optionsQuery.data;
  const sceneLabels = useMemo(() => {
    const subjectLabels = Object.fromEntries(
      (options?.subjects ?? []).map((subject) => [subject.key, subject.label])
    );
    return {
      goal: options?.goals.find((item) => item.value === answers.goal)?.label,
      stage: options?.stages[goal]?.find((item) => item.value === answers.stage)?.label,
      subjects: subjectLabels,
      budget: options?.budget_ranges.find((item) => item.id === answers.budget_segment)?.label,
    };
  }, [answers.budget_segment, answers.goal, answers.stage, goal, options]);
  const sceneState = useMemo(
    () =>
      deriveMatchingSceneState(
        answers,
        phase === "intro" ? -1 : step,
        sceneLabels,
        phase === "matching" || phase === "results"
      ),
    [answers, phase, sceneLabels, step]
  );

  const setSingle = <K extends keyof MatchingAnswers>(
    key: K,
    value: MatchingAnswers[K]
  ) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setValidationMessage(null);
  };

  const canContinue = hasAnswerForStep(answers, step);

  const finishQuestionTransition = useCallback(() => {
    setIsTransitioning(false);
    headingRef.current?.focus({ preventScroll: true });
    announceInterfaceContentReady();
  }, []);

  const prefetchOptions = useCallback(
    (nextGoal: MatchGoal, nextSubjects: string[]) =>
      queryClient.prefetchQuery({
        queryKey: ["matching-options", nextGoal, nextSubjects],
        queryFn: () => fetchMatchingOptions(nextGoal, nextSubjects),
        staleTime: 60_000,
      }),
    [queryClient]
  );

  const selectGoal = (nextGoal: MatchGoal) => {
    setAnswers(answersForGoal(nextGoal));
    setValidationMessage(null);
    void prefetchOptions(nextGoal, []);
  };

  const completeMatching = (completeAnswers: MatchingAnswers) => {
    setDirection(1);
    setPhase("matching");
    setValidationMessage(null);
    previewMutation.mutate(completeAnswers, {
      onSuccess: () => {
        setPhase("results");
        if (isStudent) {
          saveMutation.mutate(completeAnswers, {
            onSuccess: () => {
              if (draftKey) window.localStorage.removeItem(draftKey);
            },
          });
        }
      },
      onError: () => {
        setDirection(-1);
        setPhase("questions");
        setStep(6);
        setValidationMessage("Eşleşmeler hazırlanamadı. Yanıtların korundu; tekrar deneyebilirsin.");
      },
    });
  };

  const continueFlow = async () => {
    if (isTransitioning || isPreparingOptions || previewMutation.isPending) return;
    if (!canContinue) {
      setValidationMessage("Devam etmek için en az bir seçenek seç.");
      return;
    }

    if (step < 6) {
      if (step === 0 && answers.goal) {
        setIsPreparingOptions(true);
        try {
          await queryClient.ensureQueryData({
            queryKey: ["matching-options", answers.goal, []],
            queryFn: () => fetchMatchingOptions(answers.goal, []),
            staleTime: 60_000,
          });
        } catch {
          setValidationMessage("Sonraki seçenekler hazırlanamadı. Lütfen tekrar dene.");
          setIsPreparingOptions(false);
          return;
        }
        setIsPreparingOptions(false);
      }
      setDirection(1);
      setIsTransitioning(true);
      setStep((current) => current + 1);
      setValidationMessage(null);
      return;
    }

    if (isCompleteMatchingAnswers(answers)) completeMatching(answers);
  };

  const goBack = () => {
    if (isTransitioning || isPreparingOptions || previewMutation.isPending) return;
    setDirection(-1);
    setValidationMessage(null);
    if (step === 0) {
      setPhase("intro");
      return;
    }
    setIsTransitioning(true);
    setStep((current) => current - 1);
  };

  const selectSubjects = (value: string) => {
    const next = toggleLimited(subjectKeys, value, 3);
    if (next === subjectKeys) {
      setValidationMessage("En fazla üç ders seçebilirsin.");
      return;
    }
    setSingle("subject_keys", next);
    void prefetchOptions(goal, next);
  };

  const selectChallenges = (value: MatchChallenge) => {
    const current = answers.challenges ?? [];
    const next = toggleLimited(current, value, 2);
    if (next === current) {
      setValidationMessage("En fazla iki zorluk alanı seçebilirsin.");
      return;
    }
    setSingle("challenges", next);
  };

  const selectStyles = (value: TutorTeachingStyle) => {
    const current = answers.teaching_styles ?? [];
    const next = toggleLimited(current, value, 2);
    if (next === current) {
      setValidationMessage("En fazla iki hoca yaklaşımı seçebilirsin.");
      return;
    }
    setSingle("teaching_styles", next);
  };

  const renderAnswers = () => {
    if (!options) {
      if (optionsQuery.isError) {
        return (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            <p>Seçenekler şu anda yüklenemedi.</p>
            <button
              type="button"
              onClick={() => void optionsQuery.refetch()}
              className="mt-3 rounded-xl bg-white px-3 py-2 font-semibold text-red-700 shadow-sm"
            >
              Tekrar dene
            </button>
          </div>
        );
      }
      return (
        <div className="flex min-h-40 items-center justify-center rounded-3xl border border-neutral-200 bg-white">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Seçenekler hazırlanıyor…
          </span>
        </div>
      );
    }

    if (step === 0) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.goals.map((item) => (
            <SelectionCard
              key={item.value}
              label={item.label}
              selected={answers.goal === item.value}
              onClick={() => selectGoal(item.value)}
            />
          ))}
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(options.stages[goal] ?? []).map((item) => (
            <SelectionCard
              key={item.value}
              label={item.label}
              selected={answers.stage === item.value}
              onClick={() => setSingle("stage", item.value)}
            />
          ))}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div>
          <SelectionCount selected={subjectKeys.length} maximum={3} noun="ders" />
          <div className="grid gap-3 sm:grid-cols-2">
            {options.subjects.map((item) => (
              <SelectionCard
                key={item.key}
                label={item.label}
                detail={`${item.tutor_count} uygun hoca`}
                selected={subjectKeys.includes(item.key)}
                onClick={() => selectSubjects(item.key)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div>
          <SelectionCount selected={answers.challenges?.length ?? 0} maximum={2} noun="alan" />
          <div className="grid gap-3">
            {CHALLENGE_OPTIONS.map((item) => (
              <SelectionCard
                key={item.value}
                label={item.label}
                selected={(answers.challenges ?? []).includes(item.value)}
                onClick={() => selectChallenges(item.value)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div>
          <SelectionCount selected={answers.teaching_styles?.length ?? 0} maximum={2} noun="yaklaşım" />
          <div className="grid gap-3">
            {STYLE_OPTIONS.map((item) => (
              <SelectionCard
                key={item.value}
                label={item.label}
                detail={item.detail}
                selected={(answers.teaching_styles ?? []).includes(item.value)}
                onClick={() => selectStyles(item.value)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {AVAILABILITY_OPTIONS.map((item) => (
            <SelectionCard
              key={item.value}
              label={item.label}
              selected={(answers.availability_windows ?? []).includes(item.value)}
              onClick={() =>
                setSingle(
                  "availability_windows",
                  selectAvailabilityWindow(answers.availability_windows ?? [], item.value)
                )
              }
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {options.budget_ranges.map((item) => (
          <SelectionCard
            key={item.id}
            label={item.label}
            detail={
              item.min != null && item.max != null
                ? `${formatPrice(item.min)} – ${formatPrice(item.max)} / 40 dk`
                : "Tüm fiyat aralıklarını değerlendir"
            }
            selected={answers.budget_segment === item.id}
            onClick={() => setSingle("budget_segment", item.id as MatchBudgetSegment)}
          />
        ))}
      </div>
    );
  };

  if (!draftLoaded) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#fbfaf7]">
        <LoaderCircle className="h-9 w-9 animate-spin text-[#ff5968]" aria-label="Eşleştirme akışı yükleniyor" />
      </main>
    );
  }

  let content: React.ReactNode;

  if (phase === "intro") {
    content = (
      <main className="grid min-h-dvh bg-[#fbfaf7] lg:grid-cols-[42%_58%]">
        <div className="h-44 p-4 sm:h-52 sm:p-6 lg:h-dvh lg:p-8">
          <MatchingScene state={sceneState} />
        </div>
        <section className="flex items-center px-6 py-8 sm:px-10 lg:px-16 lg:py-10">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.42, ease: MATCH_EASING.enter }}
            className="mx-auto w-full max-w-xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1f2] px-3 py-1 text-sm font-semibold text-[#d94758]">
              <Sparkles className="h-4 w-4" /> Sana uygun hocayı bul
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
              Sana uygun hocayı birlikte bulalım
            </h1>
            <p className="mt-5 text-lg leading-8 text-neutral-600">
              Hedefini, ihtiyaçlarını ve programını anlamamız için sana 7 kısa soru soracağız.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-neutral-700">
              <li className="flex gap-2"><Clock3 className="h-5 w-5 text-[#ff5968]" /> 7 soruda kişisel eşleşme</li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-[#ff5968]" /> Yanıtlarını daha sonra değiştirebilirsin</li>
              <li className="flex gap-2"><GraduationCap className="h-5 w-5 text-[#ff5968]" /> Neden önerildiğini görebileceğin hocalar</li>
            </ul>
            <motion.button
              type="button"
              disabled={!options && !optionsQuery.isError}
              whileHover={reducedMotion ? undefined : { y: -1 }}
              whileTap={reducedMotion ? undefined : { scale: 0.99, y: 0 }}
              onClick={() => {
                if (!options && optionsQuery.isError) {
                  void optionsQuery.refetch();
                  return;
                }
                setDirection(1);
                setIsTransitioning(true);
                setPhase("questions");
              }}
              className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-4 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-50 sm:w-auto"
            >
              {!options
                ? optionsQuery.isError
                  ? "Tekrar dene"
                  : "Sorular hazırlanıyor…"
                : "Başlayalım"}
              {options || optionsQuery.isError
                ? <ArrowRight className="h-4 w-4" />
                : <LoaderCircle className="h-4 w-4 animate-spin" />}
            </motion.button>
            <Link href="/home" className="mt-5 block text-sm font-medium text-neutral-500 hover:text-neutral-950 sm:ml-5 sm:inline-block">
              Öğrenci ana sayfasına dön
            </Link>
          </motion.div>
        </section>
      </main>
    );
  } else if (phase === "matching") {
    content = (
      <main className="grid min-h-dvh bg-[#fbfaf7] lg:grid-cols-[42%_58%]">
        <div className="h-56 p-4 sm:h-64 sm:p-6 lg:h-dvh lg:p-8">
          <MatchingScene state={sceneState} matching />
        </div>
        <section className="flex items-center px-6 py-12 sm:px-10 lg:px-16">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reducedMotion ? 0.12 : MATCH_MOTION.reveal, ease: MATCH_EASING.enter }}
            className="mx-auto w-full max-w-xl"
            role="status"
            aria-live="polite"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f2] text-[#ff5968]">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </span>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
              Sana uygun hocaları karşılaştırıyoruz
            </h1>
            <p className="mt-4 max-w-lg leading-7 text-neutral-600">
              Yanıtlarını doğrulanmış hocaların gerçek ders, fiyat ve müsaitlik bilgileriyle karşılaştırıyoruz.
            </p>
          </motion.div>
        </section>
      </main>
    );
  } else if (phase === "results") {
    const matches = previewMutation.data?.matches ?? [];
    content = (
      <main className="min-h-dvh bg-[#fbfaf7] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => {
              setDirection(-1);
              setStep(6);
              setIsTransitioning(true);
              setPhase("questions");
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" /> Tercihleri düzenle
          </button>

          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.12 : MATCH_MOTION.reveal, ease: MATCH_EASING.enter }}
            className="mt-6 grid items-end gap-6 lg:grid-cols-[1fr_auto]"
          >
            <div className="max-w-2xl">
              <span className="text-sm font-bold uppercase tracking-wider text-[#d94758]">Eşleşmen hazır</span>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Sana uygun hocalar</h1>
              <p className="mt-4 text-neutral-600">
                Öneriler yalnızca verdiğin yanıtlar ve hocaların gerçek profil, fiyat ve müsaitlik bilgileriyle hazırlandı.
              </p>
            </div>
            <div
              className="notranslate flex flex-wrap gap-2 rounded-2xl border border-[#ffdcd2] bg-white px-4 py-3 text-xs font-semibold text-neutral-700 shadow-sm"
              translate="no"
            >
              {sceneState.goal ? <span>{sceneState.goal}</span> : null}
              {sceneState.subjects.map((subject) => <span key={subject}>· {subject}</span>)}
              <span className="text-[#d94758]">· 7 / 7 tamamlandı</span>
            </div>
          </motion.div>

          {matches.length ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {matches.map((match, index) => (
                <MatchResultCard key={match.tutor.id} match={match} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 rounded-3xl border bg-white p-10 text-center"
            >
              <Target className="mx-auto h-10 w-10 text-neutral-400" />
              <h2 className="mt-4 text-xl font-bold">Şu an tam eşleşme bulamadık</h2>
              <p className="mt-2 text-neutral-600">Tercihlerini genişletebilir veya tüm hocaları inceleyebilirsin.</p>
              <Link href="/tutors" className="mt-5 inline-flex rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white">
                Tüm hocaları gör
              </Link>
            </motion.div>
          )}

          {isStudent ? (
            <p className="mt-8 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              <Check className="h-4 w-4" />
              {saveMutation.isPending
                ? "Tercihlerin kaydediliyor…"
                : saveMutation.isError
                  ? "Tercihler kaydedilemedi; daha sonra yeniden deneyebilirsin."
                  : "Tercihlerin hesabına kaydedildi."}
            </p>
          ) : null}
        </div>
      </main>
    );
  } else {
    const buttonLabel = isPreparingOptions
      ? "Sonraki soru hazırlanıyor…"
      : step === 6
        ? "Eşleşmelerimi gör"
        : "Devam et";

    content = (
      <main className="min-h-dvh bg-[#fbfaf7] lg:grid lg:grid-cols-[42%_58%]">
        <aside className="h-40 p-3 sm:h-48 sm:p-4 lg:sticky lg:top-0 lg:h-dvh lg:p-8">
          <MatchingScene state={sceneState} />
        </aside>
        <section className="flex min-h-[calc(100dvh-10rem)] flex-col px-5 pb-28 pt-4 sm:px-10 lg:min-h-dvh lg:px-16 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-xl">
            <header className="sticky top-0 z-50 -mx-2 bg-[#fbfaf7]/95 px-2 pb-4 pt-2 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={isTransitioning || isPreparingOptions}
                  onClick={goBack}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Geri
                </button>
                <span className="text-sm font-semibold text-neutral-500" aria-live="polite">
                  <span className="notranslate tabular-nums" translate="no">{step + 1} / 7</span>
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                <motion.div
                  className="h-full origin-left rounded-full bg-[#ff5968]"
                  initial={false}
                  animate={{ scaleX: (step + 1) / 7 }}
                  transition={{ duration: reducedMotion ? 0 : MATCH_MOTION.progress, ease: MATCH_EASING.enter }}
                />
              </div>
            </header>

            <QuestionTransition
              step={step}
              direction={direction}
              onEntered={finishQuestionTransition}
            >
              <p className="mt-5 text-sm font-semibold text-[#d94758]">Sana uygun hocayı buluyoruz</p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 outline-none sm:text-4xl"
              >
                {STEP_TITLES[step]}
              </h1>
              <div className="mt-7">{renderAnswers()}</div>
              <AnimatePresence initial={false}>
                {validationMessage ? (
                  <motion.p
                    role="alert"
                    initial={reducedMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: reducedMotion ? 0.12 : MATCH_MOTION.message }}
                    className="mt-3 text-sm font-medium text-red-600"
                  >
                    {validationMessage}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </QuestionTransition>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 p-4 backdrop-blur lg:static lg:mt-auto lg:border-0 lg:bg-transparent lg:p-0 lg:pt-8">
            <div className="mx-auto flex max-w-xl justify-end">
              <motion.button
                type="button"
                disabled={!canContinue || isTransitioning || isPreparingOptions || previewMutation.isPending}
                onClick={continueFlow}
                whileTap={reducedMotion ? undefined : { scale: 0.99 }}
                layout
                transition={{ duration: MATCH_MOTION.select, ease: MATCH_EASING.interaction }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-4 font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {buttonLabel}
                {isPreparingOptions ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </motion.button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id="matching-flow">{content}</LayoutGroup>
    </MotionConfig>
  );
}

export default function MatchPage() {
  return (
    <RouteGuard
      requireAuth
      requireRole="student"
      redirectTo="/login?role=student&returnUrl=%2Fmatch"
    >
      <Suspense fallback={null}>
        <MatchingExperience />
      </Suspense>
    </RouteGuard>
  );
}
