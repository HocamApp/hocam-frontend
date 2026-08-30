import type {
  PaginatedResponse,
  Subject,
  TutorProfile,
} from "@/types";
import { applyDemoTutorPresentation } from "./demoTutorPresentation";

export const SITE_URL = "https://www.hocamozelders.com";
export const SITE_NAME = "Hocam";
export const SITE_DESCRIPTION =
  "YKS, TYT ve AYT hazırlığında öğrencileri doğrulanmış, YKS'de derece yapmış hocalarla buluşturan online özel ders platformu.";
export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://web-production-22415.up.railway.app/api";

export const PRIVATE_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
} as const;

const FETCH_TIMEOUT_MS = 8_000;

function publicApiUrl(path: string) {
  return `${PUBLIC_API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(publicApiUrl(path), {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 3_600,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Public API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeTutorsResponse(
  data: PaginatedResponse<TutorProfile> | TutorProfile[]
): PaginatedResponse<TutorProfile> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data.map(applyDemoTutorPresentation),
    };
  }
  return { ...data, results: data.results.map(applyDemoTutorPresentation) };
}

export async function fetchPublicTutors(
  page = 1,
  pageSize = 12
): Promise<PaginatedResponse<TutorProfile>> {
  const data = await fetchJson<PaginatedResponse<TutorProfile> | TutorProfile[]>(
    `/tutors/?page=${page}&page_size=${pageSize}&ordering=rating`
  );
  return normalizeTutorsResponse(data);
}

export async function fetchAllPublicTutors(): Promise<TutorProfile[]> {
  const tutors: TutorProfile[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= 20; page += 1) {
    const response = await fetchPublicTutors(page, 100);
    for (const tutor of response.results) {
      if (tutor.is_public && tutor.is_verified && !seenIds.has(tutor.id)) {
        seenIds.add(tutor.id);
        tutors.push(tutor);
      }
    }
    if (!response.next) break;
  }

  return tutors;
}

export async function fetchPublicTutor(
  id: string
): Promise<TutorProfile | null> {
  try {
    const tutor = await fetchJson<TutorProfile>(
      `/tutors/${encodeURIComponent(id)}/`
    );
    return tutor.is_public && tutor.is_verified
      ? applyDemoTutorPresentation(tutor)
      : null;
  } catch {
    return null;
  }
}

export async function fetchPublicSubjects(): Promise<Subject[]> {
  return fetchJson<Subject[]>("/subjects/");
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function cleanSeoText(value: string, maxLength = 160) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function tutorFullName(tutor: TutorProfile) {
  return `${tutor.name} ${tutor.surname}`.replace(/\s+/g, " ").trim();
}

export function tutorSeoDescription(tutor: TutorProfile) {
  const subjects = tutor.subjects
    .slice(0, 4)
    .map((subject) => `${subject.exam_type} ${subject.name}`)
    .join(", ");
  const details = [
    subjects ? `${subjects} özel ders` : "Online özel ders",
    tutor.university,
    tutor.yks_rank ? `YKS sıralaması: ${tutor.yks_rank.toLocaleString("tr-TR")}` : "",
  ].filter(Boolean);

  return cleanSeoText(`${tutorFullName(tutor)} — ${details.join(" · ")}`);
}

export function jsonLdStringify(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
