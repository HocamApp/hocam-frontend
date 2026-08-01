"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { HomeRail } from "@/components/home/HomeRail";
import { HOME_EXPLORE_CARDS } from "@/components/home/homeShowcaseContent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Goal/exam discovery: a copy block on the left, an editorial showcase rail
 * on the right. Cards lead with topic photography (~72% of the card) over a
 * white title panel (~28%); every link lands on a real route.
 *
 * Card anatomy: tall 3:4 showcase cards (~277×370 on desktop), not compact
 * tiles. On `sm` and up each card takes exactly a third of the rail so three
 * large cards are visible; below `sm` an 84vw card plus the rail's
 * screen-edge bleed shows one card with a recognisable next-card peek. The
 * 0.8fr/2.2fr grid split gives the rail enough room for 270px+ cards.
 */
export function HomeExploreCarousel() {
  return (
    <section
      aria-labelledby="home-explore-title"
      className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2.2fr)] lg:items-start lg:gap-10"
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
            className="w-[84vw] shrink-0 snap-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[calc((100%-2rem)/3)]"
          >
            <Card className="group flex h-[400px] flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg sm:h-[370px]">
              <div className="relative min-h-0 flex-1 overflow-hidden bg-muted">
                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  fill
                  sizes="(min-width: 1280px) 280px, (min-width: 1024px) 22vw, (min-width: 640px) 28vw, 84vw"
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-3 bg-card p-5">
                <p className="text-lg font-semibold tracking-tight">{card.title}</p>
                <ArrowRight
                  className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </Card>
          </Link>
        ))}
      </HomeRail>
    </section>
  );
}
