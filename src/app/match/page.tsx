"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  TutorMatchResult,
  TutorTeachingStyle,
} from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RouteGuard } from "@/components/shared/RouteGuard";

const CHALLENGE_OPTIONS: Array<{ value: MatchChallenge; label: string }> = [
  { value: "foundations", label: "Konu temellerimde eksikler var" },
  { value: "question_solving", label: "Konuyu biliyorum ama sorularda zorlanıyorum" },
  { value: "speed_accuracy", label: "Hızımı ve netlerimi artırmak istiyorum" },
  { value: "consistency", label: "Düzenli çalışmakta zorlanıyorum" },
  { value: "where_to_start", label: "Nereden başlayacağımı bilmiyorum" },
  { value: "advanced_questions", label: "Daha ileri seviye sorular çözmek istiyorum" },
];

const STYLE_OPTIONS: Array<{ value: TutorTeachingStyle; label: string; detail: string }> = [
  { value: "foundations_patient", label: "Sabırla temelden anlatan", detail: "Konuyu adım adım kurar." },
  { value: "question_speed", label: "Bol soru çözen ve hız kazandıran", detail: "Pratik ve sınav temposuna odaklanır." },
  { value: "planning_accountability", label: "Program hazırlayan ve takip eden", detail: "İlerlemeni düzenli takip eder." },
  { value: "motivating_communication", label: "Motive eden, iletişimi güçlü", detail: "Süreç boyunca yanında olur." },
  { value: "high_target", label: "Zorlayıcı ve yüksek hedef odaklı", detail: "Potansiyelini ileri taşımaya odaklanır." },
];

const AVAILABILITY_OPTIONS: Array<{ value: MatchAvailabilityWindow; label: string }> = [
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
];

const STYLE_LABELS = Object.fromEntries(STYLE_OPTIONS.map((item) => [item.value, item.label]));

function toggleLimited<T extends string>(values: T[], value: T, maximum: number): T[] {
  if (values.includes(value)) return values.filter((item) => item !== value);
  if (values.length >= maximum) return values;
  return [...values, value];
}

function SelectionCard({
  selected,
  label,
  detail,
  onClick,
}: {
  selected: boolean;
  label: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group flex min-h-14 w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5968] focus-visible:ring-offset-2 ${
        selected
          ? "border-[#ff5968] bg-[#fff1f2] text-neutral-950"
          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-[#ff5968] bg-[#ff5968] text-white" : "border-neutral-300"
        }`}
      >
        {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
      </span>
      <span>
        <span className="block text-sm font-semibold sm:text-base">{label}</span>
        {detail && <span className="mt-0.5 block text-sm text-neutral-500">{detail}</span>}
      </span>
    </button>
  );
}

function GoalMap({ step, answers }: { step: number; answers: Partial<MatchingAnswers> }) {
  return (
    <div className="relative mx-auto flex h-full min-h-[9rem] w-full max-w-lg items-center justify-center overflow-hidden rounded-[2rem] bg-[#fff8f3] p-5 sm:p-8 lg:min-h-[32rem]">
      <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-[#ff8a71]/50 to-transparent" />
      <motion.div layout className="relative grid grid-cols-3 items-center gap-4 sm:gap-7">
        <motion.div layout className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff8a71]/30 bg-white shadow-sm sm:h-20 sm:w-20">
          <Users className="h-7 w-7 text-[#ff5968]" />
        </motion.div>
        <div className="flex items-center gap-1" aria-hidden>
          {[0, 1, 2].map((item) => (
            <motion.span
              key={item}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: item * 0.06, duration: 0.25 }}
              className="h-1 w-5 origin-left rounded-full bg-[#ff8a71]/50 sm:w-8"
            />
          ))}
        </div>
        <motion.div layout className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg sm:h-20 sm:w-20">
          {step >= 5 ? <CalendarDays className="h-8 w-8" /> : <Target className="h-8 w-8" />}
        </motion.div>
      </motion.div>
      <div className="absolute bottom-4 left-5 right-5 flex flex-wrap justify-center gap-2 sm:bottom-8">
        {answers.goal && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">{answers.goal === "UNDECIDED" ? "Hedefini keşfediyor" : answers.goal}</span>}
        {(answers.subject_keys ?? []).slice(0, 3).map((subject) => (
          <span key={subject} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm"><BookOpen className="h-3 w-3" /> {subject.replaceAll("_", " ")}</span>
        ))}
      </div>
    </div>
  );
}

function reasonText(match: TutorMatchResult) {
  const reasons: string[] = [];
  if (match.matched_subjects.length) reasons.push(`${match.matched_subjects.join(", ")} ders uyumu`);
  if (match.reason_codes.includes("availability_match")) reasons.push("seçtiğin zamanlarda müsaitlik");
  if (match.matched_styles.length) reasons.push(match.matched_styles.map((style) => STYLE_LABELS[style]).join(", ").toLocaleLowerCase("tr-TR"));
  if (match.reason_codes.includes("budget_match")) reasons.push("bütçe uyumu");
  return reasons.join(" · ");
}

function MatchCard({ match }: { match: TutorMatchResult }) {
  const fullName = `${match.tutor.name} ${match.tutor.surname}`;
  const initials = `${match.tutor.name[0] ?? ""}${match.tutor.surname[0] ?? ""}`.toUpperCase();
  const nearest = match.nearest_available_at
    ? new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(match.nearest_available_at))
    : null;
  return (
    <article className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={match.tutor.profile_picture} alt={fullName} />
          <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 truncate text-lg font-bold">{fullName}<ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" aria-label="Doğrulanmış hoca" /></h3>
          <p className="truncate text-sm text-neutral-500">{match.tutor.university} · {match.tutor.department}</p>
          <p className="mt-1 text-sm font-medium">{match.tutor.total_reviews ? `★ ${match.tutor.rating.toFixed(1)} · ${match.tutor.total_reviews} değerlendirme` : "Yeni hoca"}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-[#fff8f3] p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#d94758]">Neden eşleştiniz?</p>
        <p className="mt-1 text-sm leading-6 text-neutral-700">{reasonText(match)}</p>
      </div>
      {nearest && <p className="mt-4 flex items-center gap-2 text-sm text-neutral-600"><Clock3 className="h-4 w-4 text-emerald-600" /> En yakın uygun zaman: {nearest}</p>}
      {match.caveat_codes.length > 0 && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{match.caveat_codes.includes("budget_relaxed") ? "Bu öneri seçtiğin bütçe aralığının dışında." : "Seçtiğin zamanlarda yakın bir boşluk bulunamadı; diğer uyumlara göre önerildi."}</p>}
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <p><span className="text-xl font-bold">{formatPrice(match.tutor.hourly_price)}</span><span className="text-sm text-neutral-500"> /40 dk</span></p>
        <Link href={`/tutors/${match.tutor.id}`} className="rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800">Profili incele</Link>
      </div>
    </article>
  );
}

function MatchingExperience() {
  const reducedMotion = useReducedMotion();
  const { user, isStudent } = useAuth();
  const [phase, setPhase] = useState<"intro" | "questions" | "results">("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<MatchingAnswers>>({ schema_version: 1 });
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const draftKey = user?.id ? `${MATCHING_DRAFT_KEY}:${user.id}` : null;

  const goal = answers.goal ?? "UNDECIDED";
  const subjectKeys = answers.subject_keys ?? [];
  const optionsQuery = useQuery({
    queryKey: ["matching-options", goal, subjectKeys],
    queryFn: () => fetchMatchingOptions(goal, subjectKeys),
    staleTime: 60_000,
  });
  const saveMutation = useMutation({ mutationFn: saveMatchingPreferences });
  const previewMutation = useMutation({ mutationFn: previewTutorMatches });

  useEffect(() => {
    if (!draftKey) return;
    // The matching flow is account-only now. Discard drafts created by the
    // former anonymous flow and keep new drafts isolated per student account.
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

  useEffect(() => {
    if (phase === "questions") headingRef.current?.focus();
  }, [phase, step]);

  const setSingle = <K extends keyof MatchingAnswers>(key: K, value: MatchingAnswers[K]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setValidationMessage(null);
  };

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(answers.goal);
    if (step === 1) return Boolean(answers.stage);
    if (step === 2) return Boolean(answers.subject_keys?.length);
    if (step === 3) return Boolean(answers.challenges?.length);
    if (step === 4) return Boolean(answers.teaching_styles?.length);
    if (step === 5) return Boolean(answers.availability_windows?.length);
    return Boolean(answers.budget_segment);
  }, [answers, step]);

  const continueFlow = () => {
    if (!canContinue) {
      setValidationMessage("Devam etmek için en az bir seçenek seç.");
      return;
    }
    if (step < 6) {
      setStep((current) => current + 1);
      return;
    }
    if (!isCompleteMatchingAnswers(answers)) return;
    previewMutation.mutate(answers, {
      onSuccess: () => {
        setPhase("results");
        if (isStudent) {
          saveMutation.mutate(answers, {
            onSuccess: () => {
              if (draftKey) window.localStorage.removeItem(draftKey);
            },
          });
        }
      },
    });
  };

  const selectGoal = (nextGoal: MatchGoal) => {
    setAnswers({ goal: nextGoal, schema_version: 1 });
    setValidationMessage(null);
  };

  const renderAnswers = () => {
    const options = optionsQuery.data;
    if (optionsQuery.isLoading) return <div className="h-48 animate-pulse rounded-3xl bg-neutral-100" />;
    if (optionsQuery.isError || !options) return <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Seçenekler şu anda yüklenemedi. Lütfen tekrar dene.</p>;
    if (step === 0) return <div className="grid gap-3 sm:grid-cols-2">{options.goals.map((item) => <SelectionCard key={item.value} label={item.label} selected={answers.goal === item.value} onClick={() => selectGoal(item.value)} />)}</div>;
    if (step === 1) return <div className="grid gap-3 sm:grid-cols-2">{options.stages[goal].map((item) => <SelectionCard key={item.value} label={item.label} selected={answers.stage === item.value} onClick={() => setSingle("stage", item.value)} />)}</div>;
    if (step === 2) return <div><p className="mb-3 text-sm text-neutral-500">En fazla 3 ders seçebilirsin.</p><div className="grid gap-3 sm:grid-cols-2">{options.subjects.map((item) => <SelectionCard key={item.key} label={item.label} detail={`${item.tutor_count} uygun hoca`} selected={subjectKeys.includes(item.key)} onClick={() => setSingle("subject_keys", toggleLimited(subjectKeys, item.key, 3))} />)}</div></div>;
    if (step === 3) return <div><p className="mb-3 text-sm text-neutral-500">En fazla 2 seçenek.</p><div className="grid gap-3">{CHALLENGE_OPTIONS.map((item) => <SelectionCard key={item.value} label={item.label} selected={(answers.challenges ?? []).includes(item.value)} onClick={() => setSingle("challenges", toggleLimited(answers.challenges ?? [], item.value, 2))} />)}</div></div>;
    if (step === 4) return <div><p className="mb-3 text-sm text-neutral-500">En fazla 2 yaklaşım seç.</p><div className="grid gap-3">{STYLE_OPTIONS.map((item) => <SelectionCard key={item.value} label={item.label} detail={item.detail} selected={(answers.teaching_styles ?? []).includes(item.value)} onClick={() => setSingle("teaching_styles", toggleLimited(answers.teaching_styles ?? [], item.value, 2))} />)}</div></div>;
    if (step === 5) return <div className="grid gap-3 sm:grid-cols-2">{AVAILABILITY_OPTIONS.map((item) => <SelectionCard key={item.value} label={item.label} selected={(answers.availability_windows ?? []).includes(item.value)} onClick={() => { const current = answers.availability_windows ?? []; const next = item.value === "flexible" ? ["flexible" as const] : toggleLimited(current.filter((value) => value !== "flexible"), item.value, 4); setSingle("availability_windows", next); }} />)}</div>;
    return <div className="grid gap-3">{options.budget_ranges.map((item) => <SelectionCard key={item.id} label={item.label} detail={item.min != null && item.max != null ? `${formatPrice(item.min)} – ${formatPrice(item.max)} / 40 dk` : "Tüm fiyat aralıklarını değerlendir"} selected={answers.budget_segment === item.id} onClick={() => setSingle("budget_segment", item.id as MatchBudgetSegment)} />)}</div>;
  };

  if (!draftLoaded) return <main className="flex min-h-dvh items-center justify-center bg-[#fbfaf7]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-[#ff5968]" /></main>;

  if (phase === "intro") {
    return (
      <main className="grid min-h-dvh bg-[#fbfaf7] lg:grid-cols-[42%_58%]">
        <div className="p-4 sm:p-6 lg:p-8"><GoalMap step={0} answers={answers} /></div>
        <section className="flex items-center px-6 py-10 sm:px-10 lg:px-16"><div className="mx-auto w-full max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1f2] px-3 py-1 text-sm font-semibold text-[#d94758]"><Sparkles className="h-4 w-4" /> Sana uygun hocayı bul</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">Sana uygun hocayı birlikte bulalım</h1>
          <p className="mt-5 text-lg leading-8 text-neutral-600">Hedefini, ihtiyaçlarını ve programını anlamamız için sana 7 kısa soru soracağız.</p>
          <ul className="mt-7 space-y-3 text-sm text-neutral-700"><li className="flex gap-2"><Clock3 className="h-5 w-5 text-[#ff5968]" /> 7 soruda kişisel eşleşme</li><li className="flex gap-2"><Check className="h-5 w-5 text-[#ff5968]" /> Yanıtlarını daha sonra değiştirebilirsin</li><li className="flex gap-2"><GraduationCap className="h-5 w-5 text-[#ff5968]" /> Neden önerildiğini görebileceğin hocalar</li></ul>
          <button type="button" onClick={() => setPhase("questions")} className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-4 font-semibold text-white transition hover:bg-neutral-800 sm:w-auto">Başlayalım <ArrowRight className="h-4 w-4" /></button>
          <Link href="/home" className="mt-5 block text-sm font-medium text-neutral-500 hover:text-neutral-950 sm:ml-5 sm:inline-block">Öğrenci ana sayfasına dön</Link>
        </div></section>
      </main>
    );
  }

  if (phase === "results") {
    const matches = previewMutation.data?.matches ?? [];
    return (
      <main className="min-h-dvh bg-[#fbfaf7] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <button type="button" onClick={() => { setPhase("questions"); setStep(6); }} className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-950"><ArrowLeft className="h-4 w-4" /> Tercihleri düzenle</button>
          <div className="mt-6 max-w-2xl"><span className="text-sm font-bold uppercase tracking-wider text-[#d94758]">Eşleşmen hazır</span><h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Sana uygun hocalar</h1><p className="mt-4 text-neutral-600">Öneriler yalnızca verdiğin yanıtlar ve hocaların gerçek profil, fiyat ve müsaitlik bilgileriyle hazırlandı.</p></div>
          {matches.length ? <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.55 }} className="mt-8 grid gap-5 lg:grid-cols-3">{matches.map((match) => <MatchCard key={match.tutor.id} match={match} />)}</motion.div> : <div className="mt-8 rounded-3xl border bg-white p-10 text-center"><Target className="mx-auto h-10 w-10 text-neutral-400" /><h2 className="mt-4 text-xl font-bold">Şu an tam eşleşme bulamadık</h2><p className="mt-2 text-neutral-600">Tercihlerini genişletebilir veya tüm hocaları inceleyebilirsin.</p><Link href="/tutors" className="mt-5 inline-flex rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white">Tüm hocaları gör</Link></div>}
          {isStudent && <p className="mt-8 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><Check className="h-4 w-4" /> {saveMutation.isPending ? "Tercihlerin kaydediliyor…" : saveMutation.isError ? "Tercihler kaydedilemedi; yeniden denemek için sonuçları yenile." : "Tercihlerin hesabına kaydedildi."}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#fbfaf7] lg:grid lg:grid-cols-[42%_58%]">
      <aside className="h-40 p-3 sm:h-48 sm:p-4 lg:sticky lg:top-0 lg:h-dvh lg:p-8"><GoalMap step={step} answers={answers} /></aside>
      <section className="flex min-h-[calc(100dvh-10rem)] flex-col px-5 pb-28 pt-4 sm:px-10 lg:min-h-dvh lg:px-16 lg:pb-10 lg:pt-8">
        <div className="mx-auto w-full max-w-xl">
          <header className="sticky top-0 z-10 -mx-2 bg-[#fbfaf7]/95 px-2 pb-4 pt-2 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0">
            <div className="flex items-center justify-between"><button type="button" onClick={() => step === 0 ? setPhase("intro") : setStep((current) => current - 1)} className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100"><ArrowLeft className="h-4 w-4" /> Geri</button><span className="text-sm font-semibold text-neutral-500">{step + 1} / 7</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200"><motion.div className="h-full rounded-full bg-[#ff5968]" animate={{ width: `${((step + 1) / 7) * 100}%` }} transition={{ duration: reducedMotion ? 0 : 0.25 }} /></div>
          </header>
          <AnimatePresence mode="wait" initial={false}><motion.div key={step} initial={reducedMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? undefined : { opacity: 0, x: -8 }} transition={{ duration: reducedMotion ? 0 : 0.24 }}>
            <p className="mt-5 text-sm font-semibold text-[#d94758]">Sana uygun hocayı buluyoruz</p>
            <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 outline-none sm:text-4xl">{STEP_TITLES[step]}</h1>
            <div className="mt-7">{renderAnswers()}</div>
            {validationMessage && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{validationMessage}</p>}
          </motion.div></AnimatePresence>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 p-4 backdrop-blur lg:static lg:mt-auto lg:border-0 lg:bg-transparent lg:p-0 lg:pt-8"><div className="mx-auto flex max-w-xl justify-end"><button type="button" disabled={!canContinue || previewMutation.isPending} onClick={continueFlow} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-4 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">{previewMutation.isPending ? "Hocalar karşılaştırılıyor…" : step === 6 ? "Eşleşmelerimi gör" : "Devam et"}<ArrowRight className="h-4 w-4" /></button></div>{previewMutation.isError && <p role="alert" className="mx-auto mt-2 max-w-xl text-sm text-red-600">Eşleşmeler hazırlanamadı. Lütfen tekrar dene.</p>}</div>
      </section>
    </main>
  );
}

export default function MatchPage() {
  return (
    <RouteGuard
      requireAuth
      requireRole="student"
      redirectTo="/login?role=student&returnUrl=%2Fmatch"
    >
      <Suspense fallback={null}><MatchingExperience /></Suspense>
    </RouteGuard>
  );
}
