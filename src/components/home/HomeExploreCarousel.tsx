"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { HomeRail } from "@/components/home/HomeRail";
import { HomeSceneArt } from "@/components/home/HomeSceneArt";
import { HOME_EXPLORE_CARDS } from "@/components/home/homeShowcaseContent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Goal/exam discovery: a copy block on the left, a card rail on the right.
 * Cards are placeholder content, but every link lands on a real route.
 */
export function HomeExploreCarousel() {
  return (
    <section
      aria-labelledby="home-explore-title"
      className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)] lg:items-start lg:gap-10"
    >
      <div className="min-w-0">
        <h2 id="home-explore-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Sınav hedeflerini keşfet
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          TYT, AYT, KPSS ve DGS için hangi alanda destek istediğini seç. Her başlıkta o derse
          çalışan doğrulanmış hocalara ve çıkmış sorulara ulaşırsın.
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-xl">
          <Link
            href="/tutors"
            onClick={() => trackHomeEvent("home_all_tutors_clicked", { placement: "explore" })}
          >
            Tüm dersleri gör
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <HomeRail
        label="Sınav hedefleri"
        onScrollAction={(direction) =>
          trackHomeEvent("home_teacher_rail_scrolled", { rail: "explore", direction })
        }
      >
        {HOME_EXPLORE_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            onClick={() =>
              trackHomeEvent("home_explore_card_clicked", { card_id: card.id })
            }
            className="w-[82vw] shrink-0 snap-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[228px]"
          >
            <Card className="group h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
              <HomeSceneArt
                scene={card.artwork.scene}
                tone={card.artwork.tone}
                className="h-36 w-full"
              />
              <div className="p-4">
                <p className="font-semibold">{card.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {card.description}
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                  İncele
                  <ArrowRight
                    className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </HomeRail>
    </section>
  );
}
