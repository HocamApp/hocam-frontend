"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, ChevronDown, Search } from "lucide-react";
import type { Subject } from "@/types";
import { cn } from "@/lib/utils";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { Button } from "@/components/ui/button";

interface HomeSubjectSearchProps {
  subjects?: Subject[];
  isLoading: boolean;
  isError: boolean;
  onSelectedSubjectChange?: (subject: Subject | null) => void;
}

const EXAM_ORDER = ["TYT", "AYT", "YDT", "DGS", "KPSS"];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

function subjectLabel(subject: Subject) {
  return `${subject.exam_type} ${subject.name}`;
}

export function HomeSubjectSearch({
  subjects = [],
  isLoading,
  isError,
  onSelectedSubjectChange,
}: HomeSubjectSearchProps) {
  const router = useRouter();
  const labelId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredSubjects = useMemo(() => {
    const ordered = [...subjects].sort((a, b) => {
      const examDifference =
        EXAM_ORDER.indexOf(a.exam_type) - EXAM_ORDER.indexOf(b.exam_type);
      if (examDifference !== 0) return examDifference;
      return a.name.localeCompare(b.name, "tr-TR");
    });
    const term = normalize(query);
    if (!term || (selectedSubject && query === subjectLabel(selectedSubject))) {
      return ordered;
    }
    return ordered.filter((subject) =>
      normalize(subjectLabel(subject)).includes(term)
    );
  }, [query, selectedSubject, subjects]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(0, filteredSubjects.length - 1))
    );
  }, [filteredSubjects.length]);

  const openList = () => {
    if (!isOpen) trackHomeEvent("home_subject_search_opened");
    if (selectedSubject) {
      const selectedIndex = filteredSubjects.findIndex(
        (subject) => subject.id === selectedSubject.id
      );
      if (selectedIndex >= 0) setActiveIndex(selectedIndex);
    }
    setIsOpen(true);
  };

  const selectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setQuery(subjectLabel(subject));
    setIsOpen(false);
    onSelectedSubjectChange?.(subject);
    trackHomeEvent("home_subject_selected", {
      subject_id: subject.id,
      subject_name: subject.name,
      exam_type: subject.exam_type,
    });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (selectedSubject && value !== subjectLabel(selectedSubject)) {
      setSelectedSubject(null);
      onSelectedSubjectChange?.(null);
    }
    setActiveIndex(0);
    openList();
  };

  const submit = () => {
    const params = new URLSearchParams();
    if (selectedSubject) {
      params.set("subject", selectedSubject.name);
      params.set("exam_type", selectedSubject.exam_type);
    }
    trackHomeEvent("home_tutor_search_submitted",
      selectedSubject
        ? {
            subject_id: selectedSubject.id,
            subject_name: selectedSubject.name,
            exam_type: selectedSubject.exam_type,
          }
        : { browse_all: true }
    );
    router.push(params.size ? `/tutors?${params.toString()}` : "/tutors");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openList();
      setActiveIndex((current) =>
        Math.min(current + 1, filteredSubjects.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openList();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && isOpen) {
      event.preventDefault();
      setActiveIndex(Math.max(0, filteredSubjects.length - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (isOpen && filteredSubjects[activeIndex]) {
        selectSubject(filteredSubjects[activeIndex]);
      } else {
        submit();
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const disabled = isError || (isLoading && subjects.length === 0);
  const activeSubject = filteredSubjects[activeIndex];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-3"
    >
      <label id={labelId} htmlFor="home-subject-search" className="block text-sm font-semibold text-foreground">
        Hangi ders için destek arıyorsun?
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div ref={rootRef} className="relative min-w-0 flex-1">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="home-subject-search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-labelledby={labelId}
              aria-activedescendant={
                isOpen && activeSubject ? `home-subject-${activeSubject.id}` : undefined
              }
              autoComplete="off"
              value={query}
              disabled={disabled}
              onFocus={openList}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isError
                  ? "Dersler şu anda yüklenemiyor"
                  : isLoading
                    ? "Dersler yükleniyor..."
                    : "Ders veya sınav seç"
              }
              className="h-[52px] w-full rounded-xl border bg-background py-3 pl-12 pr-11 text-base shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => (isOpen ? setIsOpen(false) : openList())}
              disabled={disabled}
              className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
              aria-label={isOpen ? "Ders listesini kapat" : "Ders listesini aç"}
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
          </div>

          {isOpen && !disabled && (
            <div
              id={listboxId}
              role="listbox"
              aria-labelledby={labelId}
              className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl"
            >
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject, index) => {
                  const previous = filteredSubjects[index - 1];
                  const startsGroup = !previous || previous.exam_type !== subject.exam_type;
                  return (
                    <div key={subject.id}>
                      {startsGroup && (
                        <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {subject.exam_type}
                        </div>
                      )}
                      <button
                        id={`home-subject-${subject.id}`}
                        type="button"
                        role="option"
                        aria-selected={selectedSubject?.id === subject.id}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSubject(subject)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none",
                          activeIndex === index && "bg-muted",
                          selectedSubject?.id === subject.id && "font-semibold text-primary"
                        )}
                      >
                        <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{subject.name}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-sm">
                  <p className="font-medium">Bu aramayla eşleşen ders yok.</p>
                  <button
                    type="button"
                    onClick={submit}
                    className="mt-2 inline-flex items-center font-medium text-primary hover:underline"
                  >
                    Tüm hocaları gör
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <Button type="submit" size="lg" className="h-[52px] rounded-xl px-6 sm:min-w-44">
          Hocaları göster
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {isError && (
        <p className="text-sm text-muted-foreground">
          Ders listesine ulaşamadık. Tüm hocaları görüntülemeye devam edebilirsin.
        </p>
      )}
    </form>
  );
}
