"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { fetchTutors } from "@/lib/tutorsApi";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { HomeRail } from "@/components/home/HomeRail";
import {
  HomeTeacherCard,
  HomeTeacherCardSkeleton,
} from "@/components/home/HomeTeacherCard";
import { buildTeacherRail } from "@/components/home/HomeTeacherRail";
import { HOME_DISCOVERY_TABS } from "@/components/home/homeShowcaseContent";

/**
 * Tabbed discovery module: a scrollable tab strip that swaps the teacher rail
 * beneath it. Each tab issues a real filtered tutor query; when a tab has too
 * few real results the rail is topped up with placeholder cards.
 */
export function HomeTabbedDiscovery({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [activeValue, setActiveValue] = useState(HOME_DISCOVERY_TABS[0].value);
  const activeTab =
    HOME_DISCOVERY_TABS.find((tab) => tab.value === activeValue) ?? HOME_DISCOVERY_TABS[0];

  const tutorsQuery = useQuery({
    queryKey: ["home-discovery-tutors", activeTab.value],
    queryFn: () =>
      fetchTutors(
        { exam_type: activeTab.examType, subject: activeTab.subject, ordering: "-rating" },
        1,
        8
      ),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  const cards = buildTeacherRail(tutorsQuery.data?.results ?? []);

  const showAllParams = new URLSearchParams();
  if (activeTab.examType) showAllParams.set("exam_type", activeTab.examType);
  if (activeTab.subject) showAllParams.set("subject", activeTab.subject);

  return (
    <section aria-labelledby="home-discovery-title" className="space-y-7">
      <div>
        <h2 id="home-discovery-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Derse göre hoca seç
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Çalışmak istediğin dersi seç, o derse bakan hocaları hemen karşılaştır.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Ders seçimi"
        className="flex gap-1 overflow-x-auto border-b [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {HOME_DISCOVERY_TABS.map((tab) => {
          const isActive = tab.value === activeValue;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`home-discovery-tab-${tab.value}`}
              aria-selected={isActive}
              aria-controls="home-discovery-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                setActiveValue(tab.value);
                trackHomeEvent("home_discovery_tab_changed", { tab: tab.value });
              }}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div id="home-discovery-panel" role="tabpanel" aria-labelledby={`home-discovery-tab-${activeValue}`}>
        {tutorsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <HomeTeacherCardSkeleton key={item} />
            ))}
          </div>
        ) : (
          <HomeRail
            label={`${activeTab.label} hocaları`}
            onScrollAction={(direction) =>
              trackHomeEvent("home_teacher_rail_scrolled", {
                rail: "discovery",
                tab: activeTab.value,
                direction,
              })
            }
          >
            {cards.map((teacher, index) => (
              <div
                key={`${activeTab.value}-${teacher.id}`}
                className="w-[82vw] shrink-0 snap-start sm:w-[268px]"
              >
                <HomeTeacherCard
                  teacher={teacher}
                  index={index}
                  onOpen={() =>
                    trackHomeEvent("home_tutor_profile_opened", {
                      tutor_id: teacher.id,
                      placement: "discovery_tab",
                      tab: activeTab.value,
                      position: index + 1,
                    })
                  }
                />
              </div>
            ))}
          </HomeRail>
        )}
      </div>

      <Link
        href={showAllParams.size ? `/tutors?${showAllParams.toString()}` : "/tutors"}
        onClick={() =>
          trackHomeEvent("home_all_tutors_clicked", {
            placement: "discovery_tab",
            tab: activeTab.value,
          })
        }
        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        Tüm {activeTab.label} hocalarını gör
        <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
